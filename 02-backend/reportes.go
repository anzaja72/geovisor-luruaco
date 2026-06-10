package main

// Módulo de reportes (Especificación §7): CSV, Excel y PDF.
// GET /api/reportes/:tipo?formato=csv|xlssx|pdf
// Tipos: sitios | monitoreos | coberturas | indicadores | insumos

import (
	"bytes"
	"encoding/csv"
	"fmt"
	"net/http"
	"time"

	"github.com/go-pdf/fpdf"
	"github.com/gofiber/fiber/v2"
	"github.com/xuri/excelize/v2"
)

type reporteDef struct {
	Titulo  string
	Headers []string
	Query   string
}

var reportes = map[string]reporteDef{
	"sitios": {
		Titulo:  "Áreas de intervención y restauración",
		Headers: []string{"Código", "Nombre", "Tipo intervención", "Estado", "Área (ha)", "Categoría", "Periodo"},
		Query: `SELECT COALESCE(codigo,''), nombre, tipo_intervencion, COALESCE(estado,''),
		        COALESCE(area_hectareas::text,''), COALESCE(categoria_calidad,''), COALESCE(periodo,'')
		        FROM eco_restauracion.vw_areas_intervencion ORDER BY tipo_intervencion, nombre`,
	},
	"monitoreos": {
		Titulo:  "Histórico de monitoreos",
		Headers: []string{"Fecha", "Indicador", "Valor", "Unidad", "Responsable", "Estación", "Observaciones"},
		Query: `SELECT m.fecha::text, m.indicador, COALESCE(m.valor::text,''), COALESCE(m.unidad,''),
		        COALESCE(m.responsable,''), COALESCE(pm.codigo_punto,''), COALESCE(m.observaciones,'')
		        FROM eco_restauracion.monitoreos m
		        LEFT JOIN eco_restauracion.puntos_monitoreo pm ON pm.id = m.estacion_id
		        ORDER BY m.fecha DESC`,
	},
	"coberturas": {
		Titulo:  "Coberturas vegetales (Corine Land Cover)",
		Headers: []string{"Código Corine", "Descripción", "Área (ha)", "%", "Fecha", "Periodo", "Fuente"},
		Query: `SELECT codigo_corine, COALESCE(descripcion,''), COALESCE(area_hectareas::text,''),
		        COALESCE(porcentaje::text,''), COALESCE(fecha::text,''), COALESCE(periodo,''), COALESCE(fuente,'')
		        FROM eco_restauracion.coberturas_vegetales ORDER BY periodo, codigo_corine`,
	},
	"indicadores": {
		Titulo:  "Consolidado de indicadores ambientales",
		Headers: []string{"Categoría", "Indicador", "Valor", "Unidad", "Fecha", "Periodo", "Fuente"},
		Query: `SELECT categoria, nombre, COALESCE(valor::text,''), COALESCE(unidad,''),
		        COALESCE(fecha::text,''), COALESCE(periodo,''), COALESCE(fuente,'')
		        FROM eco_restauracion.indicadores_ambientales ORDER BY categoria, fecha DESC`,
	},
	"insumos": {
		Titulo:  "Catálogo de insumos del levantamiento dron",
		Headers: []string{"Tipo", "Nombre", "Formato", "Tamaño (bytes)", "Estado", "URL Drive"},
		Query: `SELECT tipo, nombre, COALESCE(formato,''), COALESCE(tamano_bytes::text,''),
		        estado, COALESCE(drive_url,'')
		        FROM eco_restauracion.insumos_dron ORDER BY tipo, nombre`,
	},
}

func getReporte(c *fiber.Ctx) error {
	def, ok := reportes[c.Params("tipo")]
	if !ok {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{
			"error": "Reporte no encontrado. Tipos: sitios, monitoreos, coberturas, indicadores, insumos"})
	}

	rows, err := db.QueryContext(c.UserContext(), def.Query)
	if err != nil {
		return serverError(c, "Error consultando reporte", err)
	}
	defer rows.Close()

	cols := len(def.Headers)
	data := [][]string{}
	for rows.Next() {
		vals := make([]string, cols)
		ptrs := make([]any, cols)
		for i := range vals {
			ptrs[i] = &vals[i]
		}
		if err := rows.Scan(ptrs...); err != nil {
			continue
		}
		data = append(data, vals)
	}

	nombre := fmt.Sprintf("reporte_%s_%s", c.Params("tipo"), time.Now().Format("20060102"))
	switch c.Query("formato", "csv") {
	case "xlsx":
		return reporteXLSX(c, def, data, nombre)
	case "pdf":
		return reportePDF(c, def, data, nombre)
	default:
		return reporteCSV(c, def, data, nombre)
	}
}

func reporteCSV(c *fiber.Ctx, def reporteDef, data [][]string, nombre string) error {
	var buf bytes.Buffer
	buf.WriteString("\xEF\xBB\xBF") // BOM para Excel/acentos
	w := csv.NewWriter(&buf)
	_ = w.Write(def.Headers)
	_ = w.WriteAll(data)
	w.Flush()
	c.Set("Content-Type", "text/csv; charset=utf-8")
	c.Set("Content-Disposition", `attachment; filename="`+nombre+`.csv"`)
	return c.Send(buf.Bytes())
}

func reporteXLSX(c *fiber.Ctx, def reporteDef, data [][]string, nombre string) error {
	f := excelize.NewFile()
	sheet := "Reporte"
	_ = f.SetSheetName("Sheet1", sheet)
	_ = f.SetCellValue(sheet, "A1", def.Titulo)
	style, _ := f.NewStyle(&excelize.Style{Font: &excelize.Font{Bold: true}})
	for i, h := range def.Headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 3)
		_ = f.SetCellValue(sheet, cell, h)
		_ = f.SetCellStyle(sheet, cell, cell, style)
	}
	for r, row := range data {
		for i, v := range row {
			cell, _ := excelize.CoordinatesToCellName(i+1, r+4)
			_ = f.SetCellValue(sheet, cell, v)
		}
	}
	var buf bytes.Buffer
	if err := f.Write(&buf); err != nil {
		return serverError(c, "Error generando Excel", err)
	}
	c.Set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Set("Content-Disposition", `attachment; filename="`+nombre+`.xlsx"`)
	return c.Send(buf.Bytes())
}

func reportePDF(c *fiber.Ctx, def reporteDef, data [][]string, nombre string) error {
	pdf := fpdf.New("L", "mm", "A4", "")
	pdf.SetTitle(def.Titulo, true)
	pdf.AddPage()
	tr := pdf.UnicodeTranslatorFromDescriptor("") // soporta acentos (cp1252)

	pdf.SetFont("Helvetica", "B", 14)
	pdf.CellFormat(0, 9, tr("Geovisor Luruaco — "+def.Titulo), "", 1, "L", false, 0, "")
	pdf.SetFont("Helvetica", "", 9)
	pdf.CellFormat(0, 6, "Generado: "+time.Now().Format("2006-01-02 15:04"), "", 1, "L", false, 0, "")
	pdf.Ln(3)

	pageW, _ := pdf.GetPageSize()
	usable := pageW - 20
	colW := usable / float64(len(def.Headers))

	pdf.SetFont("Helvetica", "B", 8)
	pdf.SetFillColor(16, 58, 99)
	pdf.SetTextColor(255, 255, 255)
	for _, h := range def.Headers {
		pdf.CellFormat(colW, 7, tr(h), "1", 0, "C", true, 0, "")
	}
	pdf.Ln(-1)

	pdf.SetFont("Helvetica", "", 8)
	pdf.SetTextColor(0, 0, 0)
	fill := false
	pdf.SetFillColor(238, 242, 246)
	for _, row := range data {
		for _, v := range row {
			if len(v) > 48 {
				v = v[:45] + "..."
			}
			pdf.CellFormat(colW, 6, tr(v), "1", 0, "L", fill, 0, "")
		}
		pdf.Ln(-1)
		fill = !fill
	}
	if len(data) == 0 {
		pdf.CellFormat(usable, 8, tr("Sin registros."), "1", 1, "C", false, 0, "")
	}

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return serverError(c, "Error generando PDF", err)
	}
	c.Set("Content-Type", "application/pdf")
	c.Set("Content-Disposition", `attachment; filename="`+nombre+`.pdf"`)
	return c.Send(buf.Bytes())
}
