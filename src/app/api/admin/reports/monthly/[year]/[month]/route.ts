export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    // pathname like /api/admin/reports/monthly/2026/4
    const parts = url.pathname.split('/').filter(Boolean)
    const len = parts.length
    const year = parts[len - 2]
    const month = parts[len - 1]

    if (!year || !month) {
      return new Response(JSON.stringify({ message: 'Missing year or month' }), { status: 400 })
    }

    const backendUrl = `http://localhost:1503/api/admin/reports/monthly/${encodeURIComponent(year)}/${encodeURIComponent(month)}`
    const authorization = req.headers.get('authorization') || req.headers.get('Authorization') || ''

    const headers: HeadersInit = {}
    if (authorization) {
      headers.Authorization = authorization
    }

    const res = await fetch(backendUrl, {
      method: 'GET',
      headers,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return new Response(text || 'Export failed', { status: res.status })
    }

    const arrayBuffer = await res.arrayBuffer()
    const contentDisposition = res.headers.get('Content-Disposition') || res.headers.get('content-disposition') || ''
    const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/) || []
    const filename = filenameMatch[1] || `report_${month}_${year}.xlsx`

    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    return new Response(JSON.stringify({ message: 'Proxy error' }), { status: 500 })
  }
}
