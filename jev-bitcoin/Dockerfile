# syntax=docker/dockerfile:1

FROM golang:1.24 AS build
WORKDIR /src

COPY go.mod ./
RUN go mod download

COPY . .
# This module holds two commands: the tuning CLI and the service. Only the
# service belongs in the image. The corpus — questions and answers — travels
# inside the binary, so there is nothing else to copy into the final stage.
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/server ./cmd/server

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /out/server /server
USER nonroot:nonroot
ENV PORT=8080
EXPOSE 8080
ENTRYPOINT ["/server"]
