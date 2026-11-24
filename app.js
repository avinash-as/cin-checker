/* CIN Checker — logic
   All validation runs in the browser. No data leaves the page. */

const CURRENT_YEAR = new Date().getFullYear();

// Official MCA state codes used inside a CIN.
const STATES = {
  AN: "Andaman and Nicobar Islands",
  AP: "Andhra Pradesh",
  AR: "Arunachal Pradesh",
  AS: "Assam",
  BR: "Bihar",
  CH: "Chandigarh",
  CG: "Chhattisgarh",
  DD: "Daman and Diu",
  DL: "Delhi",
  DN: "Dadra and Nagar Haveli and Daman and Diu",
  GA: "Goa",
  GJ: "Gujarat",
  HP: "Himachal Pradesh",
  HR: "Haryana",
  JH: "Jharkhand",
  JK: "Jammu and Kashmir",
  KA: "Karnataka",
  KL: "Kerala",
  LA: "Ladakh",
  LD: "Lakshadweep",
  MH: "Maharashtra",
  ML: "Meghalaya",
  MN: "Manipur",
  MP: "Madhya Pradesh",
  MZ: "Mizoram",
  NL: "Nagaland",
  OD: "Odisha",
  PB: "Punjab",
  PY: "Puducherry",
  RJ: "Rajasthan",
  SK: "Sikkim",
  TN: "Tamil Nadu",
  TR: "Tripura",
  TS: "Telangana",
  UK: "Uttarakhand",
  UP: "Uttar Pradesh",
  WB: "West Bengal"
};

// Three-letter company-class codes (characters 13-15 of a CIN).
const COMPANY_TYPES = {
  PLC: "Public Limited Company",
  PTC: "Private Limited Company",
  OPC: "One Person Company",
  NPL: "Section 8 / Not-for-profit Company",
  FLC: "Foreign Company",
  GOI: "Government of India Company",
  SGC: "State Government Company",
  ULL: "Unlimited Liability Company"
};

// ---------- Helpers ----------

function emptyResult(value) {
  return {
    value: value,
    valid: false,
    errors: [],
    listed: "—",
    state: "—",
    year: "—",
    companyType: "—",
    entity: "Unknown"
  };
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ---------- Validation ----------

function validateCIN(value) {
  const result = {
    value: value,
    valid: false,
    errors: [],
    listed: "—",
    state: "—",
    year: "—",
    companyType: "—",
    entity: "Company"
  };

  if (value.length !== 21) {
    result.errors.push("Expected 21 characters, found " + value.length + ".");
    return result;
  }

  const listing = value[0];
  const industry = value.slice(1, 6);
  const stateCode = value.slice(6, 8);
  const yearStr = value.slice(8, 12);
  const typeCode = value.slice(12, 15);
  const regNo = value.slice(15, 21);

  if (listing !== "L" && listing !== "U") {
    result.errors.push("First character must be L (listed) or U (unlisted).");
  }
  if (!/^\d{5}$/.test(industry)) {
    result.errors.push("Characters 2-6 must be a 5-digit industry code.");
  }
  if (!/^[A-Z]{2}$/.test(stateCode)) {
    result.errors.push("Characters 7-8 must be letters (state code).");
  } else if (!STATES[stateCode]) {
    result.errors.push('Unknown state code "' + stateCode + '".');
  }
  if (!/^\d{4}$/.test(yearStr)) {
    result.errors.push("Characters 9-12 must be a 4-digit year.");
  } else {
    const year = Number(yearStr);
    if (year < 1800 || year > CURRENT_YEAR) {
      result.errors.push("Year " + year + " is outside the valid range (1800-" + CURRENT_YEAR + ").");
    }
  }
  if (!COMPANY_TYPES[typeCode]) {
    result.errors.push('Unknown company type code "' + typeCode + '".');
  }
  if (!/^\d{6}$/.test(regNo)) {
    result.errors.push("Characters 16-21 must be a 6-digit registration number.");
  }

  // Fill in whatever we could parse, even when invalid, to help the user.
  if (STATES[stateCode]) result.state = STATES[stateCode];
  if (/^\d{4}$/.test(yearStr)) {
    const y = Number(yearStr);
    if (y >= 1800 && y <= CURRENT_YEAR) result.year = yearStr;
  }
  if (COMPANY_TYPES[typeCode]) result.companyType = COMPANY_TYPES[typeCode];
  if (listing === "L" || listing === "U") {
    result.listed = listing === "L" ? "Listed" : "Unlisted";
  }

  result.valid = result.errors.length === 0;
  return result;
}

function validateLLPIN(value) {
  const result = {
    value: value,
    valid: false,
    errors: [],
    listed: "—",
    state: "—",
    year: "—",
    companyType: "—",
    entity: "LLP"
  };

  if (!/^[A-Z]{3}-\d{4}$/.test(value)) {
    if (value.indexOf("-") === -1) {
      result.errors.push("LLPIN must contain a hyphen (format AAA-1234).");
    } else {
      result.errors.push("LLPIN must be 3 letters, a hyphen, and 4 digits (format AAA-1234).");
    }
    return result;
  }

  result.valid = true;
  return result;
}

function validate(raw) {
  const value = raw.trim().toUpperCase();
  if (value === "") return null;

  // LLP-shaped (with or without hyphen).
  if (/^[A-Z]{3}-?\d{4}$/.test(value) && value.length <= 8) {
    return validateLLPIN(value);
  }
  if (value.indexOf("-") !== -1 && value.length < 21) {
    return validateLLPIN(value);
  }

  // CIN-shaped (full or a near miss).
  if (value.length === 21 || (value.indexOf("-") === -1 && value.length >= 15)) {
    return validateCIN(value);
  }

  const result = emptyResult(value);
  result.errors.push("Unrecognized format. Expected a 21-character CIN or an LLPIN (AAA-1234).");
  return result;
}

// ---------- Rendering ----------

let lastResults = [];
let currentFilter = "all";

function $(id) { return document.getElementById(id); }

function render() {
  const body = $("resultsBody");
  const emptyState = $("emptyState");
  const table = $("resultsTable");
  const filters = $("filters");
  const summary = $("summary");
  const resultsDesc = $("resultsDesc");
  const searchBox = $("searchBox");

  body.innerHTML = "";

  const query = searchBox.value.trim().toLowerCase();
  let shown = 0;
  const fragment = document.createDocumentFragment();

  lastResults.forEach(function (result) {
    if (currentFilter === "valid" && !result.valid) return;
    if (currentFilter === "invalid" && result.valid) return;
    if (query && !matchesQuery(result, query)) return;

    shown += 1;
    const row = document.createElement("tr");
    if (!result.valid) row.classList.add("invalid");

    const cells = [
      ["#", result.lineNo],
      ["Input", result.value],
      ["Entity", result.entity],
      ["Status", result.valid ? "Valid" : "Invalid"],
      ["Listed / Unlisted", result.listed],
      ["State", result.state],
      ["Year", result.year],
      ["Company type", result.companyType],
      ["Notes", result.errors.length ? result.errors.join(" ") : "—"]
    ];

    cells.forEach(function (pair) {
      const label = pair[0];
      const value = pair[1];
      const cell = document.createElement("td");
      cell.setAttribute("data-label", label);

      if (label === "#") {
        cell.textContent = value;
      } else if (label === "Input") {
        cell.innerHTML = '<span class="mono">' + escapeHtml(value) + "</span>";
      } else if (label === "Status") {
        cell.innerHTML =
          '<span class="badge ' + (result.valid ? "valid" : "invalid") + '">' +
          (result.valid ? "✓ Valid" : "✗ Invalid") + "</span>";
      } else if (label === "Notes" && result.errors.length) {
        cell.innerHTML = '<span class="errors">' + escapeHtml(value) + "</span>";
      } else {
        cell.textContent = value;
      }
      row.appendChild(cell);
    });

    fragment.appendChild(row);
  });

  body.appendChild(fragment);

  const hasResults = lastResults.length > 0;
  emptyState.classList.toggle("hidden", hasResults);
  table.classList.toggle("hidden", !hasResults);
  filters.classList.toggle("hidden", !hasResults);

  // Summary chips.
  summary.innerHTML = "";
  if (hasResults) {
    const validCount = lastResults.filter(function (r) { return r.valid; }).length;
    const invalidCount = lastResults.length - validCount;
    const llpCount = lastResults.filter(function (r) { return r.entity === "LLP"; }).length;
    const companyCount = lastResults.filter(function (r) { return r.entity === "Company"; }).length;
    const listedCount = lastResults.filter(function (r) { return r.listed === "Listed"; }).length;
    const unlistedCount = lastResults.filter(function (r) { return r.listed === "Unlisted"; }).length;

    const chips = [
      { label: "Total", value: lastResults.length, cls: "" },
      { label: "Valid", value: validCount, cls: "valid" },
      { label: "Invalid", value: invalidCount, cls: "invalid" },
      { label: "Companies", value: companyCount, cls: "" },
      { label: "LLPs", value: llpCount, cls: "llp" },
      { label: "Listed", value: listedCount, cls: "listed" },
      { label: "Unlisted", value: unlistedCount, cls: "" }
    ];

    chips.forEach(function (chip) {
      const div = document.createElement("div");
      div.className = "stat " + chip.cls;
      div.innerHTML =
        '<span class="dot"></span><span>' + chip.label + "</span><strong>" + chip.value + "</strong>";
      summary.appendChild(div);
    });
  }

  resultsDesc.textContent = hasResults
    ? lastResults.length + " number" + (lastResults.length === 1 ? "" : "s") + " checked · showing " + shown + "."
    : "No numbers checked yet.";
}

function matchesQuery(result, query) {
  return (
    result.value.toLowerCase().indexOf(query) !== -1 ||
    result.errors.join(" ").toLowerCase().indexOf(query) !== -1 ||
    result.state.toLowerCase().indexOf(query) !== -1
  );
}

function runCheck() {
  const lines = $("input").value.split(/\r?\n/);
  const items = [];
  for (let i = 0; i < lines.length; i += 1) {
    const result = validate(lines[i]);
    if (result) {
      result.lineNo = i + 1;
      items.push(result);
    }
  }
  lastResults = items;
  render();
}

function exportCsv() {
  if (lastResults.length === 0) return;

  const headers = ["#", "Input", "Entity", "Status", "Listed/Unlisted", "State", "Year", "Company type", "Notes"];
  const rows = lastResults.map(function (result, index) {
    return [
      index + 1,
      result.value,
      result.entity,
      result.valid ? "Valid" : "Invalid",
      result.listed,
      result.state,
      result.year,
      result.companyType,
      result.errors.join("; ")
    ];
  });

  const csv = [headers].concat(rows).map(function (row) {
    return row.map(function (cell) {
      return '"' + String(cell).replace(/"/g, '""') + '"';
    }).join(",");
  }).join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "cin-check-results.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function loadExample(kind) {
  const examples = {
    valid: "L17110MH1973PLC019786\nU74999DL2018PTC123456\nAAA-1234\nL01100KA2020OPC123456\nU62090TN2019PTC098765",
    invalid:
      "L17110MH1973PLC01978\nXX12345\nL17110MH1973PLC019786\nL17110XX1973PLC019786\n" +
      "L17110MH9999PLC019786\nL17110MH1973XYZ019786\nL17110MH1973PLC01978A\nAAA1234\nAAA-12",
    bulk: Array.from({ length: 500 }, function (_, i) {
      if (i % 2 === 0) {
        return "L" + String(10000 + i).slice(0, 5) + "MH20" + String(10 + (i % 10)).padStart(2, "0") +
          "PLC" + String(100000 + i).slice(0, 6);
      }
      return "AAA-" + String(1000 + i).slice(-4);
    }).join("\n")
  };

  $("input").value = examples[kind];
  runCheck();
}

// ---------- Wiring ----------

document.addEventListener("DOMContentLoaded", function () {
  $("checkBtn").addEventListener("click", runCheck);
  $("clearBtn").addEventListener("click", function () {
    $("input").value = "";
    lastResults = [];
    render();
  });
  $("exportBtn").addEventListener("click", exportCsv);

  document.querySelectorAll(".filter-btn").forEach(function (button) {
    button.addEventListener("click", function () {
      document.querySelectorAll(".filter-btn").forEach(function (b) { b.classList.remove("active"); });
      button.classList.add("active");
      currentFilter = button.dataset.filter;
      render();
    });
  });

  $("searchBox").addEventListener("input", render);

  document.querySelectorAll(".chip-example").forEach(function (chip) {
    chip.addEventListener("click", function () {
      loadExample(chip.dataset.example);
    });
  });

  render();
});
