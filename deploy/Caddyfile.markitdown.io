# MakeItDown — markitdown.io / api.markitdown.io
# Cloudflare 橙云：源站需提供 HTTPS（Full / Full Strict）。
# 当前使用自签证书 → SSL 模式请设为 Full（不要用 Full Strict）。
# 若换成 Cloudflare Origin CA，可改为 Full Strict。

(markitdown_web) {
	encode zstd gzip

	@api path /api/* /api
	handle @api {
		reverse_proxy 127.0.0.1:8010
	}

	handle {
		reverse_proxy 127.0.0.1:3010
	}
}

(markitdown_api) {
	encode zstd gzip
	header Access-Control-Allow-Origin "*"
	header Access-Control-Allow-Methods "GET, POST, HEAD, OPTIONS"
	header Access-Control-Allow-Headers "*"
	@opt method OPTIONS
	respond @opt 204
	reverse_proxy 127.0.0.1:8010
}

(tls_markitdown) {
	tls /etc/caddy/certs/markitdown.io/fullchain.pem /etc/caddy/certs/markitdown.io/privkey.pem
}

# HTTPS origin（Cloudflare Full 回源用）
markitdown.io {
	import tls_markitdown
	import markitdown_web
}

www.markitdown.io {
	import tls_markitdown
	redir https://markitdown.io{uri} 301
}

api.markitdown.io {
	import tls_markitdown
	import markitdown_api
}

# HTTP origin（Flexible 或健康检查）
http://markitdown.io, http://www.markitdown.io {
	import markitdown_web
}

http://api.markitdown.io {
	import markitdown_api
}
