export interface ExportMetadata {
  author?: string;
  date?: string;
  title?: string;
}

export const exportToWord = async (
  htmlContent: string, 
  filename: string, 
  headerHtml: string = '', 
  marginValue: string = '0.4in 0.6in 0.4in 0.6in',
  fontFamily: string = 'Times New Roman',
  lineHeight: string = '1.15',
  metadata?: ExportMetadata,
  isFrameEnabled: boolean = false,
  activeDesign: string = '',
  paperStyles?: any,
  isRoundMcq: boolean = false,
  globalLayout: number = 0,
  baseLayout: number = 0
) => {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;

  const headerDiv = document.createElement('div');
  headerDiv.innerHTML = headerHtml;

  const linePercentage = `${parseFloat(lineHeight) * 100}%`;
  const exactLineHeight = `${(parseFloat(lineHeight) * 12).toFixed(1)}pt`;

  // 1. FIX: Convert all images to Base64 (This prevents "Empty Boxes")
  const images = [...Array.from(tempDiv.querySelectorAll('img')), ...Array.from(headerDiv.querySelectorAll('img'))];
  for (const img of images) {
    try {
      const response = await fetch(img.src);
      const blob = await response.blob();
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
      img.src = base64 as string;
      
      // Force fixed size so they don't overlap
      // We use inches for Word compatibility
      const originalWidth = img.width || 550;
      
      // Check if it's a logo (often has specific styles or is in header)
      const isLogo = img.style.maxHeight === '80pt' || img.classList.contains('logo') || headerDiv.contains(img);

      if (isLogo) {
        img.setAttribute('width', '120');
        img.style.width = '1.25in';
        img.style.height = 'auto';
      } else if (originalWidth > 200) {
        // Large images (like Quest Lab images)
        img.setAttribute('width', '550'); 
        img.style.width = '6.5in'; // Adjusted for 1in margins (8.5 - 2 = 6.5)
        img.style.height = 'auto';
      } else if (originalWidth < 50) {
        // Small icons
        img.setAttribute('width', '45');
        img.style.width = '0.45in';
        img.style.height = 'auto';
      } else {
        // Medium images - preserve relative size
        const inWidth = (originalWidth / 96).toFixed(2);
        img.setAttribute('width', originalWidth.toString());
        img.style.width = `${inWidth}in`;
        img.style.height = 'auto';
      }
      img.style.display = 'block';
      if (!isLogo) img.style.margin = '5px auto';
    } catch (e) {
      console.warn("Could not convert image to base64", e);
    }
  }

  // 2. FIX: Handle Round MCQ Badges for Word
  const designClass = activeDesign || '';
  const mcqStyle = paperStyles?.mcq || 0;

  const badges = tempDiv.querySelectorAll('b, strong, span');
  badges.forEach(badge => {
    const text = badge.textContent?.trim() || "";
    // Match "A", "B", "C", "D" or "A.", "B." or "(A)", "[A]" etc.
    const isOptionLetter = /^[\[\(]?[A-D][\]\)]?\.?$/.test(text);
    
    if (isOptionLetter) {
      (badge as HTMLElement).style.display = 'inline-block';
      (badge as HTMLElement).style.width = '22pt';
      (badge as HTMLElement).style.height = '22pt';
      (badge as HTMLElement).style.lineHeight = '22pt';
      (badge as HTMLElement).style.textAlign = 'center';
      (badge as HTMLElement).style.marginRight = '6pt';
      (badge as HTMLElement).style.fontWeight = 'bold';
      (badge as HTMLElement).style.fontSize = '10pt';
      (badge as HTMLElement).style.verticalAlign = 'middle';

      // Force Boxed/Circled based on paperStyles if isRoundMcq is true OR if specific style is selected
      const forceBadge = isRoundMcq || mcqStyle === 2 || mcqStyle === 3;

      if (forceBadge) {
        // Design-Specific Word Fallbacks
        if (designClass === 'design-modern-blue') {
          (badge as HTMLElement).style.border = '1.5pt solid #2563eb';
          (badge as HTMLElement).style.backgroundColor = '#eff6ff';
          (badge as HTMLElement).style.color = '#1e40af';
          (badge as HTMLElement).style.borderRadius = '11pt';
        } else if (designClass === 'design-classic') {
          (badge as HTMLElement).style.border = '1pt solid black';
          (badge as HTMLElement).style.backgroundColor = 'transparent';
          (badge as HTMLElement).style.borderRadius = '0';
        } else if (designClass === 'design-playful') {
          (badge as HTMLElement).style.border = '2pt solid #f97316';
          (badge as HTMLElement).style.backgroundColor = '#ffedd5';
          (badge as HTMLElement).style.color = '#9a3412';
          (badge as HTMLElement).style.borderRadius = '11pt';
        } else if (designClass === 'design-technical') {
          (badge as HTMLElement).style.backgroundColor = '#0f172a';
          (badge as HTMLElement).style.color = '#ffffff';
          (badge as HTMLElement).style.border = 'none';
          (badge as HTMLElement).style.borderRadius = '0';
        } else if (designClass === 'design-elegant') {
          (badge as HTMLElement).style.border = '1pt solid #92400e';
          (badge as HTMLElement).style.backgroundColor = '#fef3c7';
          (badge as HTMLElement).style.borderRadius = '11pt';
        } else if (designClass === 'design-contrast') {
          (badge as HTMLElement).style.backgroundColor = 'black';
          (badge as HTMLElement).style.color = 'white';
          (badge as HTMLElement).style.border = 'none';
          (badge as HTMLElement).style.borderRadius = '0';
        } else if (designClass === 'design-modern-round' || designClass === 'design-projector') {
          (badge as HTMLElement).style.border = '1.5pt solid #6366f1';
          (badge as HTMLElement).style.backgroundColor = '#e0e7ff';
          (badge as HTMLElement).style.color = '#4338ca';
          (badge as HTMLElement).style.borderRadius = '11pt';
        } else {
          // Default fallback for forced badges
          (badge as HTMLElement).style.border = '1pt solid black';
          (badge as HTMLElement).style.backgroundColor = '#f8fafc';
          if (mcqStyle === 3 || isRoundMcq) {
            (badge as HTMLElement).style.borderRadius = '11pt';
          } else {
            (badge as HTMLElement).style.borderRadius = '0';
          }
        }
      }
    }
  });

  // 2.1 FIX: Handle MCQ Blank Start and Underlined Letters for Word
  const specialElements = tempDiv.querySelectorAll('.mcq-blank-start, u, .blank-line, .checkbox-box');
  specialElements.forEach(el => {
    if (el.classList.contains('mcq-blank-start') || el.classList.contains('blank-line')) {
      (el as HTMLElement).style.display = 'inline-block';
      (el as HTMLElement).style.width = '50pt';
      (el as HTMLElement).style.borderBottom = '1pt solid black';
      (el as HTMLElement).style.marginRight = '10pt';
      (el as HTMLElement).style.textAlign = 'center';
      (el as HTMLElement).style.textDecoration = 'none';
      (el as HTMLElement).innerHTML = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
    }
    if (el.classList.contains('checkbox-box')) {
      (el as HTMLElement).style.display = 'inline-block';
      (el as HTMLElement).style.width = '12pt';
      (el as HTMLElement).style.height = '12pt';
      (el as HTMLElement).style.border = '1pt solid black';
      (el as HTMLElement).style.marginRight = '5pt';
      (el as HTMLElement).style.verticalAlign = 'middle';
    }
    // If it's a <u> used for the "Letter on Line" style
    if (el.tagName === 'U' && el.textContent?.includes('\u00A0')) {
      (el as HTMLElement).style.borderBottom = '1pt solid black';
      (el as HTMLElement).style.textDecoration = 'none';
      (el as HTMLElement).style.padding = '0 5pt';
    }
  });

  // 3. FIX: Wrap everything in 100% Tables (This stops things from overlapping)
  // This is the "Magic Fix" for Word
  const sections = tempDiv.children;
  let finalHtml = "";
  for (let i = 0; i < sections.length; i++) {
    const el = sections[i];
    // If it's a new Set title, force a page break
    const isNewSet = el.textContent?.toUpperCase().includes('(SET');
    const pageBreak = isNewSet && i > 0 ? 'style="page-break-before:always"' : '';
    
    finalHtml += `
      <table border="0" cellspacing="0" cellpadding="0" width="100%" ${pageBreak} style="margin: 0; padding: 0; border-collapse: collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;">
        <tr>
          <td align="left" style="padding: 0; margin: 0; font-family: '${fontFamily}', serif; font-size: 12pt; line-height: ${exactLineHeight}; mso-line-height-rule: exactly;">
            ${el.outerHTML}
          </td>
        </tr>
      </table>`;
  }

  // 3. FIX: Table Formatting (Ensures grids and nested MCQ tables are correct)
  const tables = tempDiv.querySelectorAll('table');
  tables.forEach(table => {
    const isNested = table.parentElement?.closest('table') !== null;
    
    if (isNested) {
      // Nested tables (like MCQ options) should have NO borders and 100% width
      table.setAttribute('border', '0');
      table.style.border = 'none';
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      const cells = table.querySelectorAll('td');
      cells.forEach((c) => {
        (c as HTMLElement).style.border = 'none';
        (c as HTMLElement).style.padding = '2pt';
        
        // Check if it's the first cell in its row
        const isFirstInRow = c.previousElementSibling === null;
        if (isFirstInRow) {
          (c as HTMLElement).style.paddingLeft = '30pt'; // Indent "A." by approx 7 spaces
        }
        (c as HTMLElement).style.verticalAlign = 'top';
        (c as HTMLElement).style.width = '25%'; // Default for 4-column MCQ
      });
    } else {
      // Top-level tables
      // Robust detection: check for class OR if it's a 2-column table with specific border styles
      const hasRulerClass = table.classList.contains('ruler-table');
      const hasRulerStyle = Array.from(table.querySelectorAll('td')).some(td => td.style.borderRight && td.style.borderRight.includes('solid'));
      const isRulerTable = hasRulerClass || (hasRulerStyle && table.rows[0]?.cells.length === 2);
      
      if (isRulerTable) {
        table.setAttribute('border', '0');
        table.style.border = 'none';
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        const cells = table.querySelectorAll('td');
        cells.forEach((c) => {
          const isFirstCol = c.previousElementSibling === null;
          const isHeader = c.getAttribute('colspan') === '2' || (c.parentElement === table.rows[0] && table.rows[0].cells.length === 1);
          
          (c as HTMLElement).style.padding = '15pt';
          (c as HTMLElement).style.verticalAlign = 'top';
          
          if (isFirstCol && !isHeader) {
            (c as HTMLElement).style.borderRight = '1.5pt solid black';
            (c as HTMLElement).style.width = '50%';
          }
          if (isHeader) {
            (c as HTMLElement).style.borderBottom = '1.5pt solid black';
            (c as HTMLElement).style.textAlign = 'center';
          }
        });
      } else {
        table.setAttribute('border', '1');
        table.style.borderCollapse = 'collapse';
        table.style.margin = '0 auto';
        table.style.width = '100%';
      }
      
      // Check if it's a Word Search (many small cells with single letters)
      const cells = table.querySelectorAll('td');
      const isWordSearch = cells.length > 20 && Array.from(cells).every(c => (c.textContent?.trim().length || 0) <= 1);
      
      if (isWordSearch) {
        cells.forEach(c => {
          (c as HTMLElement).style.width = '25pt';
          (c as HTMLElement).style.height = '25pt';
          (c as HTMLElement).style.textAlign = 'center';
          (c as HTMLElement).style.lineHeight = exactLineHeight;
          (c as HTMLElement).style.setProperty('mso-line-height-rule', 'exactly');
        });
      }
    }
  });

  let metadataHtml = "";
  if (metadata) {
    metadataHtml = `
      <div style="margin-bottom: 20pt; border-bottom: 1pt solid #ccc; padding-bottom: 10pt; font-size: 9pt; color: #666; font-family: '${fontFamily}', serif;">
        ${metadata.title ? `<div style="font-size: 14pt; font-weight: bold; color: #000; margin-bottom: 5pt;">${metadata.title}</div>` : ''}
        ${metadata.author ? `<div><strong>Author:</strong> ${metadata.author}</div>` : ''}
        ${metadata.date ? `<div><strong>Date:</strong> ${metadata.date}</div>` : `<div><strong>Exported on:</strong> ${new Date().toLocaleDateString()}</div>`}
      </div>
    `;
  }

  const mTop = '0.4in';
  const mRight = '0.6in';
  const mBottom = '0.4in';
  const mLeft = '0.6in';

  const frameStyle = isFrameEnabled ? 'border: 1.5pt solid black; padding: 10pt;' : '';

  // Apply Paper Style (globalLayout) to the main container
  let paperStyleCss = '';
  let bodyBgColor = '#ffffff';
  
  if (globalLayout === 0) { // Clean White
    paperStyleCss = 'background-color: #ffffff; border: 1.5pt solid #f1f5f9; padding: 10pt;';
    bodyBgColor = '#ffffff';
  } else if (globalLayout === 1) { // Orange Mix
    paperStyleCss = 'background-color: #ffffff; border-left: 15pt solid #f97316; padding-left: 15pt;';
    bodyBgColor = '#ffffff';
  } else if (globalLayout === 2) { // Modern Emerald
    paperStyleCss = 'background-color: #f0fdf4; border-left: 15pt solid #059669; padding-left: 15pt;';
    bodyBgColor = '#f0fdf4';
  } else if (globalLayout === 3) { // Soft Lavender
    paperStyleCss = 'background-color: #faf5ff; border-top: 15pt solid #9333ea; padding-top: 15pt;';
    bodyBgColor = '#faf5ff';
  } else if (globalLayout === 4) { // Mint
    paperStyleCss = 'background-color: #f0fdf4; border: 1pt solid #dcfce7;';
    bodyBgColor = '#f0fdf4';
  } else if (globalLayout === 5) { // Peach
    paperStyleCss = 'background-color: #fff7ed; border: 1pt solid #ffedd5;';
    bodyBgColor = '#fff7ed';
  } else if (globalLayout === 6) { // Sky
    paperStyleCss = 'background-color: #f0f9ff; border: 1pt solid #e0f2fe;';
    bodyBgColor = '#f0f9ff';
  } else if (globalLayout === 7) { // Lavender
    paperStyleCss = 'background-color: #f5f3ff; border: 1pt solid #ede9fe;';
    bodyBgColor = '#f5f3ff';
  } else if (globalLayout === 8) { // Citrus
    paperStyleCss = 'background-color: #f0fdf4; border-right: 10pt solid #f97316; padding-right: 15pt;';
    bodyBgColor = '#f0fdf4';
  } else if (globalLayout === 9) { // Rose
    paperStyleCss = 'background-color: #fff1f2; border: 1pt solid #ffe4e6;';
    bodyBgColor = '#fff1f2';
  } else if (globalLayout === 10) { // Stars
    paperStyleCss = 'background-color: #ffffff; border: 10pt solid #fef3c7; padding: 10pt;';
    bodyBgColor = '#ffffff';
  } else if (globalLayout === 11) { // Flowers
    paperStyleCss = 'background-color: #ffffff; border: 10pt solid #fce7f3; padding: 10pt;';
    bodyBgColor = '#ffffff';
  } else if (globalLayout === 12) { // Hearts
    paperStyleCss = 'background-color: #ffffff; border: 10pt solid #fee2e2; padding: 10pt;';
    bodyBgColor = '#ffffff';
  } else if (globalLayout === 13) { // Bubbles
    paperStyleCss = 'background-color: #f0f9ff; border: 10pt solid #e0f2fe; padding: 10pt;';
    bodyBgColor = '#f0f9ff';
  } else if (globalLayout === 14) { // Leaves
    paperStyleCss = 'background-color: #f0fdf4; border: 10pt solid #dcfce7; padding: 10pt;';
    bodyBgColor = '#f0fdf4';
  } else if (globalLayout === 15) { // Rainbow
    paperStyleCss = 'background-color: #fff5f5; border: 2pt solid #ffe3e3;';
    bodyBgColor = '#fff5f5';
  } else if (globalLayout === 16) { // Galaxy
    paperStyleCss = 'background-color: #0f172a; color: #ffffff; border: 2pt solid #1e293b;';
    bodyBgColor = '#0f172a';
  } else if (globalLayout === 17) { // Notebook
    paperStyleCss = 'background-color: #ffffff; border-left: 3pt solid #ef4444; padding-left: 25pt;';
    bodyBgColor = '#ffffff';
  } else if (globalLayout === 18) { // Vintage
    paperStyleCss = 'background-color: #fef3c7; border: 1pt solid #fde68a;';
    bodyBgColor = '#fef3c7';
  } else if (globalLayout === 19) { // Modern
    paperStyleCss = 'background-color: #f8fafc; border: 2pt solid #e2e8f0;';
    bodyBgColor = '#f8fafc';
  }

  // Apply Base Layout (baseLayout) styles
  let baseLayoutCss = '';
  if (baseLayout === 1) { // Lined
    // For Word, we simulate lines with a subtle background color if not already set
    if (bodyBgColor === '#ffffff') bodyBgColor = '#f8fafc';
    paperStyleCss += ' border-bottom: 0.5pt solid #e2e8f0;';
  } else if (baseLayout === 2) { // Grid
    if (bodyBgColor === '#ffffff') bodyBgColor = '#f1f5f9';
  } else if (baseLayout === 3) { // Ruler
    // Ruler is handled by .ruler-table class in the HTML content
  }

  const content = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset='utf-8'>
      <style>
        @page Section1 { 
          size: 8.5in 11.0in; 
          margin: ${mTop} ${mRight} ${mBottom} ${mLeft}; 
          mso-header-margin: 0.5in; 
          mso-footer-margin: 0.5in; 
          mso-paper-source: 0;
          mso-page-margin-top: ${mTop};
          mso-page-margin-bottom: ${mBottom};
          mso-page-margin-left: ${mLeft};
          mso-page-margin-right: ${mRight};
          mso-background-source: auto;
          mso-page-background-color: ${bodyBgColor};
        }
        div.Section1 { 
          page: Section1; 
          ${frameStyle} 
          ${paperStyleCss} 
          ${baseLayoutCss} 
          mso-shading: windowtext 0% ${bodyBgColor};
        }
        body { 
          font-family: "${fontFamily}", serif; 
          font-size: 12pt; 
          line-height: ${exactLineHeight}; 
          mso-line-height-rule: exactly; 
          margin: 0;
          padding: 0;
          background-color: ${bodyBgColor};
        }
        p, div, li, span, ol, ul { 
          margin: 0pt; 
          padding: 0pt; 
          line-height: ${exactLineHeight}; 
          mso-line-height-rule: exactly;
          mso-ascii-font-family: "${fontFamily}";
          mso-hansi-font-family: "${fontFamily}";
          mso-bidi-font-family: "${fontFamily}";
          mso-margin-top-alt: 0pt;
          mso-margin-bottom-alt: 0pt;
        }
        img { border: none; display: block; }
        table { 
          mso-table-lspace:0pt; 
          mso-table-rspace:0pt; 
          border-collapse: collapse; 
          margin: 0; 
          width: 100%;
          mso-line-height-rule: exactly;
        }
        td { 
          font-family: "${fontFamily}", serif; 
          font-size: 12pt; 
          line-height: ${exactLineHeight}; 
          mso-line-height-rule: exactly; 
          padding: 0;
          vertical-align: top;
          mso-margin-top-alt: 0pt;
          mso-margin-bottom-alt: 0pt;
        }
        .header-row { background-color: #334155; color: white; text-align: center; font-weight: bold; padding: 10px; }
      </style>
    </head>
    <body>
      <div class="Section1">
        ${headerDiv.innerHTML}
        ${metadataHtml}
        ${finalHtml}
      </div>
    </body>
    </html>`;

  const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};