'use client'
/** Test posta kutusunun istemci parçaları: onaylı boşaltma düğmesi ve e-posta gövdesinin güvenli gösterimi. */
import { useMemo } from 'react'
import { testPostalariniBosaltEylemi } from '@/eylemler/yonetim'

export function KutuyuBosalt({ sayi }: { sayi: number }) {
  return (
    <form
      action={testPostalariniBosaltEylemi}
      onSubmit={(e) => {
        if (!window.confirm(`Kutudaki ${sayi} e-postanın hepsi silinecek. Devam etmek istiyor musunuz?`)) e.preventDefault()
      }}
    >
      <button type="submit" className="dugme dugme--ikincil dugme--kucuk" disabled={!sayi}>
        Kutuyu boşalt
      </button>
    </form>
  )
}

/**
 * E-posta HTML'i betik çalıştırmayan korumalı çerçevede gösterilir (sandbox: betik yok, form yok, aynı köken yok).
 * Bağlantılar yeni sekmede açılır; davet ve doğrulama bağlantıları test ortamının kendi adresine gider.
 */
export function PostaGovdesi({ html, baslik }: { html: string; baslik: string }) {
  const belge = useMemo(() => `<!doctype html><html><head><meta charset="utf-8"><base target="_blank"></head><body style="margin:0">${html}</body></html>`, [html])
  return <iframe className="posta-cerceve" title={`E-posta: ${baslik}`} sandbox="allow-popups allow-popups-to-escape-sandbox" srcDoc={belge} />
}
