/**
 * Backend Google Sheets untuk MerchMate.
 * Deploy sebagai Web app: Execute as Me, access Anyone (jika diizinkan akun).
 */
const SHEET_NAME = "Pesanan MerchMate";

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) throw new Error("Data pesanan kosong.");
    const order = JSON.parse(e.postData.contents);
    validateOrder_(order);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(["Waktu Pesan","ID Pesanan","Nama","WhatsApp","Kelas/Kelompok","Catatan","ID Produk","Nama Produk","Kategori","Harga Satuan","Jumlah","Subtotal","Total Pesanan","Status Pesanan","Status Pembayaran"]);
      sheet.setFrozenRows(1);
      sheet.getRange(1,1,1,15).setFontWeight("bold").setBackground("#ffe2ee");
      sheet.autoResizeColumns(1,15);
    }
    const timestamp = new Date(order.createdAt || new Date());
    const rows = order.items.map(item => [
      timestamp, cleanCell_(order.orderId), cleanCell_(order.name), cleanCell_(order.phone),
      cleanCell_(order.customerClass || ""), cleanCell_(order.note || ""),
      cleanCell_(item.id), cleanCell_(item.name), cleanCell_(item.category),
      Number(item.price), Number(item.quantity), Number(item.subtotal), Number(order.total),
      "Pre-order diterima", "Belum dibayar — bayar saat barang tersedia"
    ]);
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try { sheet.getRange(sheet.getLastRow()+1,1,rows.length,rows[0].length).setValues(rows); }
    finally { lock.releaseLock(); }
    return output_({ok:true,orderId:order.orderId});
  } catch (error) {
    console.error(error);
    return output_({ok:false,error:String(error.message || error)});
  }
}
function doGet(){return output_({ok:true,service:"MerchMate order endpoint"});}
function validateOrder_(order) {
  if(!order || !order.orderId || !order.name || !order.phone) throw new Error("Data pembeli atau ID pesanan tidak lengkap.");
  if(!Array.isArray(order.items) || order.items.length<1 || order.items.length>50) throw new Error("Daftar item tidak valid.");
  order.items.forEach(item=>{
    if(!item.name || !Number.isFinite(Number(item.price)) || !Number.isInteger(Number(item.quantity)) || Number(item.quantity)<1 || Number(item.quantity)>100) throw new Error("Item pesanan tidak valid.");
  });
}
function cleanCell_(value) {
  const s=String(value==null?"":value).slice(0,1000);
  return /^[=+\\-@]/.test(s) ? "'"+s : s;
}
function output_(data){return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);}
