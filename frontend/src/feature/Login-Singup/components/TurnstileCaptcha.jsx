import { useEffect, useMemo, useRef } from 'react'

/**
 * Cloudflare Turnstile 위젯
 * - siteKey: 공개키 (VITE_TURNSTILE_SITEKEY)
 * - onVerify: (token: string) => void
 * - onExpire: () => void
 * - onError: () => void
 */
function TurnstileCaptcha({ siteKey, onVerify, onExpire, onError }) {
  const containerRef = useRef(null)
  const widgetIdRef = useRef(null)
  const callbacksRef = useRef({ onVerify, onExpire, onError })

  const scriptId = useMemo(() => 'cf-turnstile-script', [])

  // 부모에서 내려오는 콜백이 렌더마다 새로 생겨도 위젯을 재생성하지 않도록 ref로 보관
  useEffect(() => {
    callbacksRef.current = { onVerify, onExpire, onError }
  }, [onVerify, onExpire, onError])

  useEffect(() => {
    if (!siteKey) return
    if (!containerRef.current) return

    const ensureScript = () =>
      new Promise((resolve, reject) => {
        if (window.turnstile) return resolve()

        const existing = document.getElementById(scriptId)
        if (existing) {
          existing.addEventListener('load', () => resolve(), { once: true })
          existing.addEventListener('error', () => reject(new Error('Turnstile script load failed')), { once: true })
          return
        }

        const script = document.createElement('script')
        script.id = scriptId
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
        script.async = true
        script.defer = true
        script.onload = () => resolve()
        script.onerror = () => reject(new Error('Turnstile script load failed'))
        document.head.appendChild(script)
      })

    let cancelled = false

    ;(async () => {
      try {
        await ensureScript()
        if (cancelled) return
        if (!window.turnstile || !containerRef.current) return

        // 기존 렌더가 남아있으면 제거
        if (widgetIdRef.current) {
          try {
            window.turnstile.remove(widgetIdRef.current)
          } catch {
            // noop
          }
          widgetIdRef.current = null
        }

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token) => callbacksRef.current.onVerify?.(token),
          'expired-callback': () => callbacksRef.current.onExpire?.(),
          'error-callback': () => callbacksRef.current.onError?.(),
        })
      } catch (e) {
        console.error(e)
        callbacksRef.current.onError?.()
      }
    })()

    return () => {
      cancelled = true
      if (window.turnstile && widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch {
          // noop
        }
      }
      widgetIdRef.current = null
    }
  }, [siteKey, scriptId])

  if (!siteKey) {
    return (
      <div className="p-3 bg-gray-50 border border-gray-200 text-xs text-gray-400">
        CAPTCHA 비활성화 (VITE_TURNSTILE_SITEKEY 미설정)
      </div>
    )
  }

  return <div ref={containerRef} />
}

export default TurnstileCaptcha


