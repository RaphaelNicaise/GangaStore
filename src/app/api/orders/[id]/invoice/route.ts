import { handler } from "@/lib/api"
import { OrderService } from "@/services/order.service"
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"

function formatARS(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value)
}

export const GET = handler(async (_req, context) => {
  const { id } = await context.params
  const order = await OrderService.findById(id)

  const pdfDoc = await PDFDocument.create()
  let page = pdfDoc.addPage([595.28, 841.89]) // A4

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const drawText = (text: string, x: number, y: number, size = 11, bold = false) => {
    page.drawText(text, {
      x,
      y,
      size,
      font: bold ? fontBold : fontRegular,
      color: rgb(0.12, 0.12, 0.12),
    })
  }

  let y = 800
  drawText("TermoStore - Factura / Presupuesto", 40, y, 16, true)
  y -= 28

  drawText(`Pedido: ${order.code}`, 40, y)
  drawText(`Fecha: ${new Date(order.createdAt).toLocaleString("es-AR")}`, 330, y)
  y -= 18

  drawText(`Cliente: ${order.customerFirstName} ${order.customerLastName}`, 40, y)
  y -= 16
  drawText(`Telefono: ${order.customerPhone}`, 40, y)
  y -= 28

  drawText("Detalle de productos", 40, y, 12, true)
  y -= 18

  drawText("Producto", 40, y, 10, true)
  drawText("Cant.", 330, y, 10, true)
  drawText("P. Unit", 390, y, 10, true)
  drawText("Subtotal", 480, y, 10, true)
  y -= 10
  page.drawLine({ start: { x: 40, y }, end: { x: 555, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) })
  y -= 16

  for (const item of order.items) {
    if (y < 80) {
      page = pdfDoc.addPage([595.28, 841.89])
      y = 800
    }

    const name = item.productName.length > 42 ? `${item.productName.slice(0, 42)}...` : item.productName
    drawText(name, 40, y, 10)
    drawText(String(item.quantity), 335, y, 10)
    drawText(formatARS(Number(item.unitPrice)), 388, y, 10)
    drawText(formatARS(Number(item.lineTotal)), 478, y, 10)
    y -= 16
  }

  y -= 8
  page.drawLine({ start: { x: 40, y }, end: { x: 555, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) })
  y -= 22

  drawText("Total productos (sin envio):", 320, y, 12, true)
  drawText(formatARS(Number(order.totalProducts)), 478, y, 12, true)

  y -= 40
  drawText("Nota: Envio y pago se coordinan por WhatsApp.", 40, y, 10)

  const pdfBytes = await pdfDoc.save()

  return new Response(pdfBytes as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="factura-${order.code}.pdf"`,
      "Cache-Control": "no-store",
    },
  })
})
