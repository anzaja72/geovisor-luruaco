# ============================================================
# Servidor MCP del geovisor (solo biblioteca estándar, imagen ~8 MB).
# ============================================================
FROM golang:1.26-alpine AS build
WORKDIR /src
COPY go.mod ./
COPY *.go ./
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /luruaco-mcp .

FROM alpine:3.20
RUN apk add --no-cache ca-certificates tzdata && adduser -D -u 1000 app \
 && mkdir -p /var/log/mcp && chown app /var/log/mcp
USER app
COPY --from=build /luruaco-mcp /usr/local/bin/luruaco-mcp
EXPOSE 8090
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8090/health || exit 1
ENTRYPOINT ["luruaco-mcp"]
