export default function middleware(req) {
  return new Response("⚠️ SISTEMA EM MANUTENÇÃO\n\nO acesso está temporariamente suspenso para atualizações de segurança.\nRetornaremos em breve.\n\nAtenciosamente,\nEquipe Lotérica Central", {
    status: 503,
    headers: { 
      'content-type': 'text/plain; charset=utf-8',
      'Retry-After': '3600'
    }
  });
}
