# TeknoKariyer — Node.js sunucusu (PostgreSQL + S3 uyumlu depolama). Türkiye'de sunucuya geçiş için (K2).
# Ayrıntı: docs/goc-rehberi.md. Cloudflare dağıtımı bu dosyayı kullanmaz.
#
# Derleme:  docker compose --env-file sunucu.env build
# Kurum ağında TLS denetleyen bir vekil sunucu varsa kök sertifikası gizli olarak verilir (imaja yazılmaz):
#   docker build --secret id=kok_sertifika,src=/yol/kurum-ca.pem .

FROM node:22-bookworm-slim AS bagimliliklar
WORKDIR /uygulama
ENV NEXT_TELEMETRY_DISABLED=1 COREPACK_ENABLE_DOWNLOAD_PROMPT=0
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=secret,id=kok_sertifika,required=false \
    if [ -f /run/secrets/kok_sertifika ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/kok_sertifika; fi; \
    corepack enable && pnpm install --frozen-lockfile

FROM bagimliliklar AS derleme
COPY . .
ENV SAGLAYICI=node
# Derleme önbelleği imaja girmez
RUN pnpm run build && rm -r .next/cache

FROM derleme AS calisma
ENV NODE_ENV=production SAGLAYICI=node PORT=3000 HOSTNAME=0.0.0.0 NODE_OPTIONS=--no-deprecation
# Uygulama root olmayan kullanıcıyla çalışır (Next önbelleği .next altına yazar)
RUN chown -R node:node /uygulama/.next
USER node
EXPOSE 3000
# Çalışırken pnpm kullanılmaz: corepack açılışta pnpm'i internetten indirmeye çalışırdı
CMD ["node_modules/.bin/next", "start"]
