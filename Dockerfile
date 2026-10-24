# Game server for Hamravesh (or any Docker host). Build from the repository root:
#   docker build -t chakachak-server .
FROM node:22-slim
WORKDIR /app
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile --filter "@chakachak/server..."
ENV NODE_ENV=production DATA_DIR=/data PORT=8080
# The SQLite file and its backups live here: mount a persistent disk at /data.
VOLUME /data
EXPOSE 8080
CMD ["pnpm", "--filter", "@chakachak/server", "start"]
