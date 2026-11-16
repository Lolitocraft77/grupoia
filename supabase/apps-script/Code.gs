/**
 * BOP — doGet (Google Apps Script)
 *
 * Devuelve { teams, newSales } para el Edge Function google-sheets-proxy.
 *
 * INSTALACIÓN (recomendada): abrí TU Sheet → Extensiones → Apps Script,
 * pegá este archivo y desplegalo como Aplicación web (Ejecutar como: yo,
 * Acceso: cualquier persona). Así el script queda VINCULADO al Sheet.
 *
 * Si en cambio usás un proyecto standalone (script.google.com → Nuevo
 * proyecto), completá SPREADSHEET_ID abajo con el ID del Sheet (lo que va entre
 * /d/ y /edit en la URL). El error "No item with the given ID could be found"
 * significa que ese ID no existe o que la cuenta que despliega no tiene acceso.
 *
 * Después de cada "Nueva implementación" Google genera una URL nueva:
 *   supabase secrets set APPS_SCRIPT_URL="https://script.google.com/macros/s/<ID>/exec"
 *   supabase functions deploy google-sheets-proxy --no-verify-jwt
 * (o en el Dashboard: Edge Functions → Secrets → APPS_SCRIPT_URL)
 *
 * FUENTES DE DATOS:
 *
 * Hoja "Base_Agregada" — FUENTE OFICIAL DEL MONTO QUE ANIMA EL DESTACADO.
 *   A = Agente, B = Fecha, C = Monto, D = semana,
 *   E = equipo, F = fecha limpia, G = equipo limpio.
 *   Cada fila = una venta. La animación dispara con el `Monto` de esta hoja.
 *
 * Hoja "Tabla" (solo totales acumulados que se muestran en la pizarra):
 *   A2:A16 → nombre de agente (15 agentes, fila 17 es "total")
 *   B = dia, C = semana, D = mes (por agente)
 *   H5:H8 → nombre de equipo
 *   I = dia, J = semana, K = mes (por equipo)
 *
 * Hoja "Equipos" (mapeo agente → equipo):
 *   A = agente, B = equipo (rangos A1:B15)
 *
 * Hoja "Form Responses 1" (opcional, sólo para timestamps):
 *   A = Timestamp, B = Fecha de deposito, C = Agente.
 *   Permite distinguir ventas frescas (recién enviadas) de históricas.
 *
 * El "total acumulado" mostrado al lado de cada agente usa "Tabla" col D (mes).
 * El monto que dispara la animación usa "Base_Agregada" col C (Monto).
 */

var TEAM_GOAL = 50000;

/** Opcional: ID del Sheet. Vacío = usar el Sheet al que está vinculado el script. */
var SPREADSHEET_ID = "";

function openSpreadsheet() {
  if (SPREADSHEET_ID) {
    try {
      return SpreadsheetApp.openById(SPREADSHEET_ID);
    } catch (e) {
      throw new Error(
        "No pude abrir SPREADSHEET_ID '" + SPREADSHEET_ID + "'. Verificá el ID y " +
        "que la cuenta que despliega el script tenga acceso. (" + e.message + ")"
      );
    }
  }
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error(
      "Script no vinculado a un Sheet: crealo desde Extensiones → Apps Script " +
      "o completá SPREADSHEET_ID"
    );
  }
  return ss;
}

function doGet() {
  try {
    var ss = openSpreadsheet();

    console.log("[BOP-GS] doGet → leyendo:", ss.getName());

    var sheetTabla = ss.getSheetByName("Tabla");
    var sheetEquipos = ss.getSheetByName("Equipos");
    var sheetBase = ss.getSheetByName("Base_Agregada");
    var sheetForm = ss.getSheetByName("Form Responses 1"); // opcional, solo para timestamps

    if (!sheetTabla) return jsonResponse({ error: "Falta hoja 'Tabla'" });
    if (!sheetEquipos) return jsonResponse({ error: "Falta hoja 'Equipos'" });
    if (!sheetBase) return jsonResponse({ error: "Falta hoja 'Base_Agregada'" });

    var dataTabla = sheetTabla.getDataRange().getValues();
    var dataEquipos = sheetEquipos.getDataRange().getValues();
    var dataBase = sheetBase.getDataRange().getValues();
    var dataForm = sheetForm ? sheetForm.getDataRange().getValues() : [];

    var teams = processTeamsData(dataTabla, dataEquipos);
    var newSales = processNewSalesFromBaseAgregada(dataBase, dataForm);

    console.log(
      "[BOP-GS] Base_Agregada filas leídas:",
      dataBase.length,
      "→ ventas válidas:",
      newSales.length,
      "| teams:",
      teams.length
    );

    return jsonResponse({ teams: teams, newSales: newSales });
  } catch (e) {
    console.error("[BOP-GS] doGet error:", e.toString(), e.stack || "");
    return jsonResponse({ error: e.toString(), stack: e.stack || null });
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function processTeamsData(dataTabla, dataEquipos) {
  // Defensa contra filas de subtotal/encabezado capturadas por error.
  var EXCLUDED_NAMES = ["total", "subtotal", "totales", "agentes", "agente", "nombre", "equipos", "equipo"];

  // 1) Mapeo agente → equipo desde la hoja "Equipos" (A:B, sin encabezado).
  var agentToTeam = {};
  for (var i = 0; i < dataEquipos.length; i++) {
    var agent = dataEquipos[i][0];
    var teamName = dataEquipos[i][1];
    var nameStr = agent ? agent.toString().trim() : '';
    var teamStr = teamName ? teamName.toString().trim() : '';
    if (nameStr === '' || teamStr === '') continue;
    if (EXCLUDED_NAMES.indexOf(nameStr.toLowerCase()) !== -1) continue;
    agentToTeam[nameStr] = teamStr;
  }

  // 2) Totales por equipo desde "Tabla" H5:K8 (col H=nombre, I=dia, J=semana, K=mes).
  //    H4 es encabezado "Equipos"; los datos arrancan en fila 5 (índice 4).
  var teamTotals = {};
  var teamOrder = [];
  for (var r = 4; r < dataTabla.length; r++) {
    var row = dataTabla[r];
    var tName = row[7]; // Col H
    var tDia = parseFloat(row[8]) || 0;    // Col I (dia)
    var tSemana = parseFloat(row[9]) || 0; // Col J (semana)
    var tMes = parseFloat(row[10]) || 0;   // Col K (mes)
    var tStr = tName ? tName.toString().trim() : '';
    if (tStr === '') continue;
    if (EXCLUDED_NAMES.indexOf(tStr.toLowerCase()) !== -1) continue;
    teamTotals[tStr] = { dia: tDia, semana: tSemana, mes: tMes };
    teamOrder.push(tStr);
  }

  // 3) Totales por agente desde "Tabla" A2:D16 (col A=nombre, col D=mes).
  //    Fila 17 es "total" y queda fuera por EXCLUDED_NAMES.
  var teamsMap = {};
  for (var j = 1; j < dataTabla.length; j++) {
    var rowA = dataTabla[j];
    var agentName = rowA[0]; // Col A
    var agentMes = parseFloat(rowA[3]) || 0; // Col D (mes)
    var aStr = agentName ? agentName.toString().trim() : '';
    if (aStr === '') continue;
    if (EXCLUDED_NAMES.indexOf(aStr.toLowerCase()) !== -1) continue;

    var team = agentToTeam[aStr];
    if (!team) continue; // agente sin equipo asignado → se omite.

    if (!teamsMap[team]) {
      var tt = teamTotals[team] || { dia: 0, semana: 0, mes: 0 };
      teamsMap[team] = {
        id: team.toLowerCase().replace(/\s+/g, '-'),
        name: team,
        goal: TEAM_GOAL,
        total_real: tt.mes,
        dia: tt.dia,
        semana: tt.semana,
        mes: tt.mes,
        agents: []
      };
    }

    teamsMap[team].agents.push({
      id: aStr.toLowerCase().replace(/\s+/g, '-') + '-' + j,
      name: aStr,
      avatar:
        "https://api.dicebear.com/7.x/avataaars/svg?seed=" +
        encodeURIComponent(aStr),
      sales: agentMes,
      teamId: team.toLowerCase().replace(/\s+/g, '-')
    });
  }

  // 4) Devolver equipos en el orden en que aparecen en la pizarra (H5:H8).
  var teams = [];
  for (var k = 0; k < teamOrder.length; k++) {
    var tn = teamOrder[k];
    if (teamsMap[tn] && teamsMap[tn].agents.length > 0) {
      teams.push(teamsMap[tn]);
    }
  }
  // Por si quedó algún equipo sin total en la pizarra pero con agentes asignados.
  for (var key in teamsMap) {
    if (teamOrder.indexOf(key) === -1 && teamsMap[key].agents.length > 0) {
      teams.push(teamsMap[key]);
    }
  }

  return teams;
}

/**
 * FUENTE OFICIAL del monto que anima el destacado.
 * Lee la hoja "Base_Agregada":
 *   col A = Agente, col B = Fecha, col C = Monto.
 * Cruza con "Form Responses 1" (col A = Timestamp de envío del formulario,
 * col B = Fecha de deposito, col C = Agente) para sacar `submittedAt`.
 *
 * `submittedAt` permite distinguir ventas FRESCAS (recién enviadas) de
 * históricas, así la animación dispara aunque el dashboard se abra después.
 */
function processNewSalesFromBaseAgregada(data, dataForm) {
  // 1) Lookup (agente|fecha) → último Timestamp de Form Responses 1.
  var tsMap = {};
  for (var f = 1; f < (dataForm || []).length; f++) {
    var fr = dataForm[f];
    var ts = fr[0];        // col A: Timestamp
    var fechaDep = fr[1];  // col B: Fecha de deposito
    var agt = fr[2];       // col C: Agente
    if (!ts || !agt) continue;
    var agtStr = agt.toString().trim();
    if (!agtStr) continue;
    var key = agtStr.toLowerCase() + '|' + dateKey(fechaDep);
    var tsMs = ts instanceof Date ? ts.getTime() : Date.parse(ts.toString());
    if (isNaN(tsMs)) continue;
    if (!tsMap[key] || tsMs > tsMap[key]) tsMap[key] = tsMs;
  }

  // 2) Recorrer Base_Agregada y armar newSales.
  var sales = [];
  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var agentName = row[0]; // Col A: Agente
    var entryDate = row[1]; // Col B: Fecha
    var rawMonto = row[2];  // Col C: Monto

    if (agentName == null) continue;

    var nameStr = agentName.toString().trim();
    if (!nameStr) continue;

    var lower = nameStr.toLowerCase();
    if (lower === "agente" || lower === "fecha" || lower === "monto") continue;

    var monto = toNumber(rawMonto);
    if (!(monto > 0)) continue;
    if (entryDate === undefined || entryDate === null || entryDate === "") continue;

    var entryDateStr =
      entryDate instanceof Date ? entryDate.toISOString() : entryDate.toString();

    var key2 = nameStr.toLowerCase() + '|' + dateKey(entryDate);
    var submittedAt = tsMap[key2]
      ? new Date(tsMap[key2]).toISOString()
      : null;

    // Solo loguear las primeras 5 filas para no saturar Stackdriver con
    // sheets grandes. El total se loguea al final en doGet().
    if (sales.length < 5) {
      console.log("[BOP-GS] Base_Agregada row", i, "→", JSON.stringify({
        agente: nameStr,
        monto: monto,
        submittedAt: submittedAt
      }));
    }

    sales.push({
      agentName: nameStr,
      entryDate: entryDateStr,
      value: monto,
      submittedAt: submittedAt
    });
  }

  return sales;
}

/**
 * Normaliza una fecha (Date o string) a clave "YYYY-MM-DD" para joins.
 */
function dateKey(v) {
  if (!v) return '';
  if (v instanceof Date) {
    var y = v.getFullYear();
    var m = ('0' + (v.getMonth() + 1)).slice(-2);
    var d = ('0' + v.getDate()).slice(-2);
    return y + '-' + m + '-' + d;
  }
  var s = v.toString();
  var parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    var y2 = parsed.getFullYear();
    var m2 = ('0' + (parsed.getMonth() + 1)).slice(-2);
    var d2 = ('0' + parsed.getDate()).slice(-2);
    return y2 + '-' + m2 + '-' + d2;
  }
  return s;
}

/**
 * Convierte cualquier representación de número en un Number.
 * - Si ya es number, lo devuelve.
 * - Si es string con coma decimal o separador de miles, lo limpia.
 */
function toNumber(v) {
  if (typeof v === "number") return v;
  if (v == null) return 0;
  var s = v.toString().trim();
  if (!s) return 0;
  // Si tiene coma y punto, asumir formato US (1,234.56) y quitar comas.
  // Si solo tiene coma, asumir europeo (1234,56) y convertir coma a punto.
  if (s.indexOf(",") !== -1 && s.indexOf(".") !== -1) {
    s = s.replace(/,/g, "");
  } else if (s.indexOf(",") !== -1 && s.indexOf(".") === -1) {
    s = s.replace(/,/g, ".");
  }
  s = s.replace(/[^\d.\-]/g, "");
  var n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

/**
 * Función de diagnóstico — corré esta primero para verificar que todo está bien.
 * Editor → dropdown de funciones → "test" → ▶ Ejecutar.
 * Después abrí el Registro de ejecución y mirá los console.log.
 */
function test() {
  var ss;
  try {
    ss = openSpreadsheet();
  } catch (e) {
    console.log("[BOP-GS] ERROR:", e.message);
    return;
  }
  console.log("[BOP-GS] Spreadsheet name:", ss.getName());

  var sheetNames = ss.getSheets().map(function (s) { return s.getName(); });
  console.log("[BOP-GS] Hojas existentes:", JSON.stringify(sheetNames));

  console.log("[BOP-GS] Hoja 'Tabla':", ss.getSheetByName("Tabla") ? "OK" : "NO ENCONTRADA");
  console.log("[BOP-GS] Hoja 'Equipos':", ss.getSheetByName("Equipos") ? "OK" : "NO ENCONTRADA");
  console.log("[BOP-GS] Hoja 'Base_Agregada':", ss.getSheetByName("Base_Agregada") ? "OK" : "NO ENCONTRADA");

  // Ejecutar el doGet completo y mostrar resultado.
  var result = doGet();
  console.log("[BOP-GS] doGet output:", result.getContent().substring(0, 1500));
}
