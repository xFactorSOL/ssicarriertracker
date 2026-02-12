/**
 * CSV Import Helper for RFQ Lanes
 * Parses your Walmart spreadsheet format and imports into database
 */

const parseCSV = (csvText) => {
  const lines = csvText.split('\n');
  const lanes = [];
  
  // Skip header row (starts at row 5 in your spreadsheet)
  // Columns: Origin City, Origin State, Destination, Destination State, Equipment Type, 
  //          Commodity, Projected Annual Shipment Volume, Service Type, Rate, Transit Time, 
  //          Cargo Insurance, Max Weight, Remarks
  
  for (let i = 4; i < lines.length; i++) { // Start at row 5 (index 4)
    const line = lines[i].trim();
    if (!line) continue;
    
    const columns = parseCSVLine(line);
    if (columns.length < 8) continue; // Skip invalid rows
    
    const lane = {
      lane_number: i - 3, // Lane 1, 2, 3...
      origin_city: columns[0]?.trim(),
      origin_state: columns[1]?.trim(),
      destination_city: columns[2]?.trim(),
      destination_state: columns[3]?.trim(),
      equipment_type: columns[4]?.trim(),
      commodity: columns[5]?.trim(),
      annual_volume: parseInt(columns[6]) || 0,
      service_type: columns[7]?.trim() || 'Full Truckload',
      special_instructions: columns[12]?.trim() || '',
    };
    
    // Estimate miles (you can use a real API later)
    lane.estimated_miles = estimateMiles(
      lane.origin_city,
      lane.origin_state,
      lane.destination_city,
      lane.destination_state
    );
    
    // Set temperature ranges for reefer
    if (lane.equipment_type.toLowerCase().includes('reefer')) {
      lane.temperature_min = -10;
      lane.temperature_max = 32;
    }
    
    lanes.push(lane);
  }
  
  return lanes;
};

// Parse CSV line handling quoted fields
const parseCSVLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
};

// Rough mileage estimates (US major city pairs)
const estimateMiles = (originCity, originState, destCity, destState) => {
  // Common routes from your RFQ
  const routes = {
    'Wheeling-IL-Miami-FL': 1380,
    'Perryville-MO-Miami-FL': 1150,
    'Perryville-MO-Houston-TX': 900,
    'Visalia-CA-Houston-TX': 1600,
    'Visalia-CA-Los Angeles-CA': 200,
    'Newnan-GA-Miami-FL': 650,
    'Pleasant Prairie-WI-Miami-FL': 1420,
    'Cambria-WI-Miami-FL': 1450,
    'Atlanta-GA-Miami-FL': 660,
    'Opelousas-LA-Miami-FL': 1100,
    'Burlington-IA-Miami-FL': 1300,
    'Charleston-SC-Miami-FL': 550,
    'St Ansgar-IA-New Jersey-NJ': 1100,
    'St Ansgar-IA-Miami-FL': 1400,
    'La Grange-GA-Miami-FL': 600,
    'Los Angeles-CA-Miami-FL': 2750,
    'Elk Grove Village-IL-Miami-FL': 1380,
    'Westerville-OH-Miami-FL': 1150,
    'Victorville-CA-Miami-FL': 2700,
    'Carthage-MO-Miami-FL': 1200,
    'Bristol-VA-Miami-FL': 900,
    'Fowler-CA-Miami-FL': 2800,
    'New Jersey-NJ-Miami-FL': 1280,
    'Chesterfield-MO-Miami-FL': 1200,
    'Victorville-CA-Los Angeles-CA': 85,
    'Greer-SC-Miami-FL': 620,
    'El Paso-TX-Miami-FL': 1950,
    'Spanish Fork-UT-Miami-FL': 2200,
    'Delaware-OH-Miami-FL': 1150,
    'Bedford Park-IL-Miami-FL': 1380,
  };
  
  const key = `${originCity}-${originState}-${destCity}-${destState}`;
  return routes[key] || 1000; // Default 1000 miles if not found
};

// Generate SQL INSERT statements
const generateInsertSQL = (rfqId, lanes) => {
  let sql = '-- Import RFQ Lanes\n\n';
  
  lanes.forEach(lane => {
    sql += `INSERT INTO rfq_lanes (
  rfq_id, lane_number, origin_city, origin_state, destination_city, destination_state,
  equipment_type, commodity, annual_volume, service_type, estimated_miles${
    lane.temperature_min ? ', temperature_min, temperature_max' : ''
  }${
    lane.special_instructions ? ', special_instructions' : ''
  }
) VALUES (
  '${rfqId}', ${lane.lane_number}, '${lane.origin_city}', '${lane.origin_state}',
  '${lane.destination_city}', '${lane.destination_state}', '${lane.equipment_type}',
  '${lane.commodity}', ${lane.annual_volume}, '${lane.service_type}', ${lane.estimated_miles}${
    lane.temperature_min ? `, ${lane.temperature_min}, ${lane.temperature_max}` : ''
  }${
    lane.special_instructions ? `, '${lane.special_instructions.replace(/'/g, "''")}'` : ''
  }
);\n\n`;
  });
  
  return sql;
};

// Export for use in Node.js or browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { parseCSV, generateInsertSQL };
}

// Example usage:
/*
const csvText = `...your CSV content...`;
const lanes = parseCSV(csvText);
const sql = generateInsertSQL('YOUR-RFQ-ID', lanes);
console.log(sql);
*/

// Or use in React component:
/*
const handleCSVUpload = (file) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const csvText = e.target.result;
    const lanes = parseCSV(csvText);
    
    // Send to API
    fetch(`/api/rfq/${rfqId}/lanes/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lanes })
    });
  };
  reader.readAsText(file);
};
*/
