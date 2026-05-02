export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const year = url.searchParams.get('year')
    const month = url.searchParams.get('month')

    if (!year || !month) {
      return new Response(JSON.stringify({ message: 'Missing year or month' }), { status: 400 })
    }

    const backendUrl = `http://localhost:1503/api/admin/reports/monthly?year=${encodeURIComponent(year)}&month=${encodeURIComponent(month)}`

    const res = await fetch(backendUrl, {
      method: 'GET',
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
