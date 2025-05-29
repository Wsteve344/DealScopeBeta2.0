import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { PDFDocument, rgb, StandardFonts } from 'npm:pdf-lib@1.17.1';
import { decode as decodeJwt } from 'npm:jwt-decode';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400'
};

Deno.serve(async (req) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }), 
        {
          status: 405,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }), 
        {
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Extract and validate JWT
    const token = authHeader.replace('Bearer ', '');
    let userId;
    try {
      const decoded = decodeJwt(token);
      userId = decoded.sub;
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }), 
        {
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }), 
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    if (!body?.dealId) {
      return new Response(
        JSON.stringify({ error: 'Deal ID is required' }), 
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    const { dealId } = body;

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }), 
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch deal data
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .select(`
        *,
        deal_sections (*)
      `)
      .eq('id', dealId)
      .eq('investor_id', userId)
      .is('deleted_at', null)
      .single();

    if (dealError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch deal data', details: dealError.message }), 
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    if (!deal) {
      return new Response(
        JSON.stringify({ error: 'Deal not found or access denied' }), 
        {
          status: 404,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Create PDF document
    const pdfDoc = await PDFDocument.create();
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const page = pdfDoc.addPage([612, 792]); // Standard US Letter size
    const { height } = page.getSize();

    // Set font
    const fontSize = 12;
    page.setFont(timesRomanFont);

    // Add header
    page.drawText('Deal Analysis Report', {
      x: 50,
      y: height - 50,
      size: 24,
      font: timesRomanFont,
      color: rgb(0, 0, 0)
    });

    let yPosition = height - 100;

    // Add deal information
    page.drawText(`Property Address: ${deal.address}`, {
      x: 50,
      y: yPosition,
      size: fontSize,
      font: timesRomanFont,
      color: rgb(0, 0, 0)
    });

    yPosition -= 30;

    page.drawText(`Analysis Progress: ${deal.progress}%`, {
      x: 50,
      y: yPosition,
      size: fontSize,
      font: timesRomanFont,
      color: rgb(0, 0, 0)
    });

    yPosition -= 50;

    // Add sections
    if (deal.deal_sections && Array.isArray(deal.deal_sections)) {
      for (const section of deal.deal_sections) {
        // Check if we need a new page
        if (yPosition < 100) {
          page = pdfDoc.addPage([612, 792]);
          yPosition = height - 50;
        }

        const sectionTitle = section.type
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        page.drawText(sectionTitle, {
          x: 50,
          y: yPosition,
          size: 16,
          font: timesRomanFont,
          color: rgb(0, 0, 0)
        });

        yPosition -= 30;

        if (section.data) {
          try {
            const data = JSON.stringify(section.data, null, 2)
              .split('\n')
              .slice(1, -1) // Remove the opening and closing braces
              .join('\n')
              .replace(/["{},]/g, '')
              .replace(/:/g, ': ');

            const lines = data.split('\n');
            for (const line of lines) {
              if (yPosition < 50) {
                page = pdfDoc.addPage([612, 792]);
                yPosition = height - 50;
              }

              page.drawText(line.trim(), {
                x: 70,
                y: yPosition,
                size: fontSize,
                font: timesRomanFont,
                color: rgb(0, 0, 0)
              });

              yPosition -= 20;
            }

            yPosition -= 20;
          } catch (error) {
            console.error('Error processing section data:', error);
            // Continue with next section if there's an error
            continue;
          }
        }
      }
    }

    // Generate PDF bytes
    const pdfBytes = await pdfDoc.save();

    return new Response(pdfBytes, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="deal-report.pdf"'
      }
    });

  } catch (error) {
    console.error('Error generating report:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate report',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), 
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});