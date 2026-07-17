package middleware

import (
	"crypto/subtle"
	"net/http"
	"strings"
)

// WorkerAuth 仅校验经 Cloudflare Worker 中转流量的一致性（X-Worker-Secret 匹配）。
// 它不是源站防线：
//
// - expected 为空时直接放行（兼容直接访问与开发环境）。
// - 请求路径匹配 skipPrefixes 中的任意前缀时直接放行（用于微信回调等公开路由）。
// - 未携带 X-Forwarded-Host（即直接访问源站）时放行是设计所需，允许 SaaS 小程序直连 pro.papafeiji.cn。
// - 只有携带 X-Forwarded-Host（即经 Cloudflare Worker 中转）时才校验 X-Worker-Secret，失败返回 403。
func WorkerAuth(expected string, skipPrefixes ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if expected == "" {
				next.ServeHTTP(w, r)
				return
			}

			path := r.URL.Path
			for _, prefix := range skipPrefixes {
				if prefix != "" && strings.HasPrefix(path, prefix) {
					next.ServeHTTP(w, r)
					return
				}
			}

			// 直接访问源站时放行；Worker 一定会带 X-Forwarded-Host。
			if r.Header.Get("X-Forwarded-Host") == "" {
				next.ServeHTTP(w, r)
				return
			}

			provided := r.Header.Get("X-Worker-Secret")
			if provided == "" || subtle.ConstantTimeCompare([]byte(provided), []byte(expected)) != 1 {
				http.Error(w, "forbidden", http.StatusForbidden)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
