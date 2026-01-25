// Supabase Edge Function to scrape FMCSA SAFER Company Snapshot
// Deploy with: supabase functions deploy scrape-fmcsa

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CarrierData {
  success: boolean;
  error?: string;
  data?: {
    legalName: string;
    dbaName: string;
    usdotNumber: string;
    mcNumber: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
    entityType: string;
    operatingStatus: string;
    safetyRating: string;
    powerUnits: string;
    drivers: string;
  };
}

// Parse the FMCSA HTML response
function parseCarrierHTML(html: string, searchMC: string): CarrierData {
  try {
    // Check if carrier was found
    if (html.includes("No records matching") || html.includes("record matching your criteria") || html.includes("Search produced no results")) {
      return { success: false, error: "No carrier found with this MC number" };
    }

    // Extract company name from title or header
    // Format: <TITLE>SAFER Web - Company Snapshot B MARRON LOGISTICS LLC</TITLE>
    // Or: <B>B MARRON LOGISTICS LLC</B>
    let legalName = '';
    const titleMatch = html.match(/<TITLE>SAFER Web - Company Snapshot ([^<]+)<\/TITLE>/i);
    if (titleMatch && titleMatch[1]) {
      legalName = titleMatch[1].trim();
    }
    
    // Backup: look for the company name in the header
    if (!legalName) {
      const headerMatch = html.match(/<FONT size="3" face="arial">\s*<B>([^<]+)<\/B>/i);
      if (headerMatch && headerMatch[1]) {
        legalName = headerMatch[1].trim();
      }
    }

    // Extract USDOT Number
    // Format: USDOT Number: 3177404
    let usdotNumber = '';
    const dotMatch = html.match(/USDOT Number:\s*(\d+)/i);
    if (dotMatch && dotMatch[1]) {
      usdotNumber = dotMatch[1].trim();
    }

    // Extract MC Number(s)
    // Look in the MC/MX/FF Number(s) row
    let mcNumber = searchMC;
    const mcMatch = html.match(/MC-(\d+)/i);
    if (mcMatch && mcMatch[1]) {
      mcNumber = mcMatch[1].trim();
    }

    // Extract Physical Address
    // Format: <TH...>Physical Address:</A></TH>\s*<TD class="queryfield"...>ADDRESS<br>CITY, STATE ZIP</TD>
    let address = '', city = '', state = '', zip = '';
    const addressMatch = html.match(/Physical Address:<\/A><\/TH>\s*<TD[^>]*>\s*([^<]+)<br>\s*([^<]+)/i);
    if (addressMatch) {
      address = addressMatch[1].trim();
      const cityStateZip = addressMatch[2].trim();
      // Parse "RIVERDALE, GA  30296"
      const cszMatch = cityStateZip.match(/([^,]+),\s*(\w{2})\s*(?:&nbsp;)?\s*(\d{5}(?:-\d{4})?)?/i);
      if (cszMatch) {
        city = cszMatch[1].trim();
        state = cszMatch[2].trim();
        zip = (cszMatch[3] || '').trim();
      }
    }

    // Extract Phone
    // Format: <TH...>Phone:</A></TH>\s*<TD class="queryfield"...>(XXX) XXX-XXXX</TD>
    let phone = '';
    const phoneMatch = html.match(/Phone:<\/A><\/TH>\s*<TD[^>]*>\s*\(?(\d{3})\)?\s*[-.\s]?(\d{3})[-.\s]?(\d{4})/i);
    if (phoneMatch) {
      phone = `(${phoneMatch[1]}) ${phoneMatch[2]}-${phoneMatch[3]}`;
    }

    // Extract Entity Type (CARRIER, BROKER, etc.)
    let entityType = '';
    const entityMatch = html.match(/Entity Type:<\/A><\/TH>\s*<TD[^>]*>([^<&]+)/i);
    if (entityMatch && entityMatch[1]) {
      entityType = entityMatch[1].trim();
    }

    // Extract USDOT Status (Operating Status)
    // Format: USDOT Status:</A></TH>...<TD class="queryfield"...>ACTIVE</TD>
    let operatingStatus = '';
    const statusMatch = html.match(/USDOT Status:<\/A><\/TH>\s*<TD[^>]*>\s*(?:<!--[^>]*-->)?\s*(\w+)/i);
    if (statusMatch && statusMatch[1]) {
      operatingStatus = statusMatch[1].trim();
    }

    // Extract Safety Rating (if available)
    // Most carriers don't have a rating
    let safetyRating = 'None';
    const ratingMatch = html.match(/Safety Rating:<\/A><\/TH>\s*<TD[^>]*>([^<]+)/i);
    if (ratingMatch && ratingMatch[1]) {
      const rating = ratingMatch[1].trim();
      if (rating && !rating.includes('None') && rating.length > 0) {
        safetyRating = rating;
      }
    }

    // Extract Power Units
    // Format: <TH...>Power Units:</A></TH>\s*<TD class="queryfield"...>1</TD>
    let powerUnits = '0';
    const powerMatch = html.match(/Power Units:<\/A><\/TH>\s*<TD[^>]*>(\d+)/i);
    if (powerMatch && powerMatch[1]) {
      powerUnits = powerMatch[1].trim();
    }

    // Extract Drivers
    // Format: <TH...>Drivers:</A></TH>\s*<TD...>1</TD>
    let drivers = '0';
    const driversMatch = html.match(/Drivers:<\/A><\/TH>\s*<TD[^>]*>(?:<[^>]*>)*(\d+)/i);
    if (driversMatch && driversMatch[1]) {
      drivers = driversMatch[1].trim();
    }

    // Check if we got meaningful data
    if (!legalName && !usdotNumber) {
      return { success: false, error: "Could not parse carrier data. The MC number may be invalid." };
    }

    return {
      success: true,
      data: {
        legalName: legalName || '',
        dbaName: '', // DBA is often same as legal name in FMCSA
        usdotNumber: usdotNumber || '',
        mcNumber: mcNumber || searchMC,
        address: address || '',
        city: city || '',
        state: state || '',
        zip: zip || '',
        phone: phone || '',
        entityType: entityType || '',
        operatingStatus: operatingStatus || '',
        safetyRating: safetyRating,
        powerUnits: powerUnits,
        drivers: drivers,
      }
    };
  } catch (error) {
    return { success: false, error: `Failed to parse carrier data: ${error.message}` };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { mcNumber } = await req.json();

    if (!mcNumber) {
      return new Response(
        JSON.stringify({ success: false, error: 'MC number is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Clean the MC number (remove "MC" prefix if present, remove spaces)
    const cleanMC = mcNumber.toString().replace(/^MC[-\s]*/i, '').replace(/\s/g, '').trim();

    if (!/^\d+$/.test(cleanMC)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid MC number format. Please enter numbers only (e.g., 123456).' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // FMCSA SAFER query URL for MC number search
    const fmcsaUrl = `https://safer.fmcsa.dot.gov/query.asp?searchtype=ANY&query_type=queryCarrierSnapshot&query_param=MC_MX&query_string=${cleanMC}`;

    console.log(`Fetching FMCSA data for MC#: ${cleanMC}`);

    const response = await fetch(fmcsaUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ success: false, error: `FMCSA request failed with status: ${response.status}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
      );
    }

    const html = await response.text();
    
    // Parse the carrier data from HTML
    const carrierData = parseCarrierHTML(html, cleanMC);

    return new Response(
      JSON.stringify(carrierData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
