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
  baseLayout: number = 0,
  instructionRulerStyle: number = 0
) => {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;

  const headerDiv = document.createElement('div');
  headerDiv.innerHTML = headerHtml;

  const linePercentage = `200%`;
  const exactLineHeight = `24pt`;

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

  // 2.2 FIX: Handle Header for Middle Ruler (Option 4)
  if (baseLayout === 3) {
    // Wrap the entire header in a 2-column table to ensure the red line continues
    const headerContent = headerDiv.innerHTML;
    headerDiv.innerHTML = `
      <table border="0" cellspacing="0" cellpadding="0" width="100%" style="width: 100%; border-collapse: collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;">
        <tr>
          <td width="50%" style="padding: 0; border-right: 1.5pt solid #ff0000; mso-border-right-alt: 1.5pt solid #ff0000; vertical-align: top;">
            ${headerContent}
          </td>
          <td width="50%" style="padding: 0; vertical-align: top;">
            <!-- Spacer for ruler continuity -->
          </td>
        </tr>
      </table>
    `;
    
    // Now specifically handle the Name/Date flex container inside the first column
    const headerContainer = headerDiv.querySelector('.flex.justify-between');
    if (headerContainer) {
      const leftContent = headerContainer.firstElementChild?.innerHTML || '';
      const rightContent = headerContainer.lastElementChild?.innerHTML || '';
      
      headerContainer.outerHTML = `
        <table border="0" cellspacing="0" cellpadding="0" width="100%" style="width: 100%; border-collapse: collapse; margin: 0; mso-table-lspace:0pt; mso-table-rspace:0pt;">
          <tr>
            <td width="50%" style="padding: 5pt; border-right: 1.5pt solid #ff0000; mso-border-right-alt: 1.5pt solid #ff0000; vertical-align: top;">
              ${leftContent}
            </td>
            <td width="50%" style="padding: 5pt; vertical-align: top;">
              ${rightContent}
            </td>
          </tr>
        </table>
      `;
    }
  }
  // This is the "Magic Fix" for Word
  let sections = Array.from(tempDiv.children);
  
  // If the only child is the prose div, unwrap it to process its children
  if (sections.length === 1 && sections[0].classList.contains('prose')) {
    sections = Array.from(sections[0].children);
  } else if (sections.length > 1) {
    // Filter out decorative container if it's at the top level
    sections = sections.filter(el => el.id !== 'decorative-elements-container');
    // If we have a prose div among others, we might need to unwrap it too
    const proseIndex = sections.findIndex(el => el.classList.contains('prose'));
    if (proseIndex !== -1) {
      const prose = sections[proseIndex];
      sections.splice(proseIndex, 1, ...Array.from(prose.children));
    }
  }

  let finalHtml = "";
  for (let i = 0; i < sections.length; i++) {
    const el = sections[i] as HTMLElement;
    
    if (el.id === 'decorative-elements-container' || el.classList.contains('decorative-element')) {
      continue;
    }

    // If it's a new Set title, force a page break
    const isNewSet = el.textContent?.toUpperCase().includes('(SET');
    const pageBreak = isNewSet && i > 0 ? 'style="page-break-before:always"' : '';
    
    if (el.style.backdropFilter || el.getAttribute('style')?.includes('backdrop-filter')) {
      el.style.backgroundColor = '#f8fafc';
      el.style.setProperty('mso-shading', 'windowtext 0% #f8fafc');
    }
    
    // If it's a "Part" header or instruction block
    if (el.classList.contains('bg-relax-blue') || el.style.backgroundColor === 'rgb(240, 249, 255)') {
      el.style.backgroundColor = '#f0f9ff';
      el.style.setProperty('mso-shading', 'windowtext 0% #f0f9ff');
    }
    // ... add more as needed

    finalHtml += `
      <table border="0" cellspacing="0" cellpadding="0" width="100%" ${pageBreak} style="margin: 0; padding: 0; border-collapse: collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; width: 100%;">
        <tr>
          <td align="left" style="padding: 0; margin: 0; font-family: '${fontFamily}', serif; font-size: 12pt; line-height: ${exactLineHeight}; mso-line-height-rule: exactly; border: none;">
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
      const hasRulerClass = table.classList.contains('ruler-table') || table.className.includes('ruler-table');
      const isTwoCol = table.rows.length > 0 && table.rows[0].cells.length === 2;
      // Also check if any cell has a border-right style already
      const hasVerticalBorder = Array.from(table.querySelectorAll('td')).some(td => {
        const style = td.getAttribute('style') || '';
        return style.includes('border-right') && style.includes('solid');
      });
      
      const isRulerTable = hasRulerClass || hasVerticalBorder || (isTwoCol && table.getAttribute('data-type') === 'ruler') || (baseLayout === 3 && isTwoCol);
      
      // If it's a ruler table, we MUST force the border
      if (isRulerTable) {
        table.setAttribute('border', '0');
        table.style.border = 'none';
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse'; // Changed from separate to collapse for better Word support
        (table.style as any).msoTableLspace = '0pt';
        (table.style as any).msoTableRspace = '0pt';
        table.style.margin = '0';
        
        const rows = Array.from(table.rows);
        rows.forEach((row) => {
          const cells = Array.from(row.cells);
          cells.forEach((c, idx) => {
            const isFirstCol = idx === 0;
            const isHeader = c.getAttribute('colspan') === '2' || (row === table.rows[0] && row.cells.length === 1);
            
            const cell = c as HTMLElement;
            cell.style.padding = '15pt';
            cell.style.verticalAlign = 'top';
            cell.style.border = 'none'; 
            
            if (isFirstCol && !isHeader && row.cells.length === 2) {
              // THIS IS THE CRITICAL RULER LINE - Using RED as requested/shown in image
              // We apply it to EVERY cell in the first column to ensure a continuous line
              cell.style.borderRight = '1.5pt solid #ff0000'; 
              cell.style.setProperty('mso-border-right-alt', '1.5pt solid #ff0000');
              cell.style.width = '50%'; 
              cell.style.paddingRight = '15pt';
            }
            if (!isFirstCol && !isHeader && row.cells.length === 2) {
              cell.style.width = '50%';
              cell.style.paddingLeft = '15pt';
            }
            if (isHeader) {
              cell.style.borderBottom = '2.5pt solid #334155';
              cell.style.setProperty('mso-border-bottom-alt', '2.5pt solid #334155');
              cell.style.textAlign = 'center';
            }
          });
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
    paperStyleCss = 'background-color: #ffffff; border: 10pt solid #fef3c7; padding: 10pt; border-style: double;';
    bodyBgColor = '#ffffff';
  } else if (globalLayout === 11) { // Flowers
    paperStyleCss = 'background-color: #ffffff; border: 10pt solid #fce7f3; padding: 10pt; border-style: double;';
    bodyBgColor = '#ffffff';
  } else if (globalLayout === 12) { // Hearts
    paperStyleCss = 'background-color: #ffffff; border: 10pt solid #fee2e2; padding: 10pt; border-style: dashed;';
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

  const shadingStyle = `mso-shading: windowtext 0% ${bodyBgColor};`;

  // 4. Structural Layout Enhancements (Borders for Paper Styles)
  let containerStyle = `padding: 10pt; min-height: 10in; ${shadingStyle} ${frameStyle} ${paperStyleCss}`;
  
  // Ensure all borders in paperStyleCss have mso-border-alt equivalents
  if (paperStyleCss.includes('border-left')) {
    const match = paperStyleCss.match(/border-left:\s*([^;]+)/);
    if (match) containerStyle += ` mso-border-left-alt: ${match[1]};`;
  }
  if (paperStyleCss.includes('border-right')) {
    const match = paperStyleCss.match(/border-right:\s*([^;]+)/);
    if (match) containerStyle += ` mso-border-right-alt: ${match[1]};`;
  }
  if (paperStyleCss.includes('border-top')) {
    const match = paperStyleCss.match(/border-top:\s*([^;]+)/);
    if (match) containerStyle += ` mso-border-top-alt: ${match[1]};`;
  }
  if (paperStyleCss.includes('border-bottom')) {
    const match = paperStyleCss.match(/border-bottom:\s*([^;]+)/);
    if (match) containerStyle += ` mso-border-bottom-alt: ${match[1]};`;
  }
  if (paperStyleCss.includes('border:') && !paperStyleCss.includes('border-')) {
    const match = paperStyleCss.match(/border:\s*([^;]+)/);
    if (match) containerStyle += ` mso-border-alt: ${match[1]};`;
  }

  // 5. Lined Paper Structural Fix (Apply border-bottom to paragraphs)
  // This is NATIVE Word borders, not visuals.
  if (baseLayout === 1 || baseLayout === 3 || baseLayout === 4 || baseLayout >= 5) {
    const pElements = tempDiv.querySelectorAll('p, div.item, li, td, span, h1, h2, h3');
    pElements.forEach(p => {
      const el = p as HTMLElement;
      // Don't apply to header rows or empty spans
      if (el.closest('.header-row') || el.classList.contains('header-row')) return;
      if (el.tagName === 'SPAN' && !el.textContent?.trim()) return;
      
      el.style.borderBottom = '0.5pt solid #cbd5e1';
      el.style.paddingBottom = '4pt';
      el.style.marginBottom = '8pt';
      el.style.setProperty('mso-border-bottom-alt', '0.5pt solid #cbd5e1');
    });
    
    // Also apply to headerDiv elements
    const headerElements = headerDiv.querySelectorAll('p, h1, h2, h3, div');
    headerElements.forEach(el => {
      const element = el as HTMLElement;
      element.style.borderBottom = '0.5pt solid #cbd5e1';
      element.style.paddingBottom = '4pt';
      element.style.marginBottom = '8pt';
      element.style.setProperty('mso-border-bottom-alt', '0.5pt solid #cbd5e1');
    });
  }

  // 6. Instruction Ruler Structural Fix
  if (instructionRulerStyle > 0) {
    const headerSection = tempDiv.querySelector('div.flex.flex-col.items-center');
    if (headerSection) {
      const rulerDiv = document.createElement('div');
      rulerDiv.style.width = '100%';
      rulerDiv.style.marginTop = '15pt';
      rulerDiv.style.marginBottom = '15pt';
      
      if (instructionRulerStyle === 1) {
        rulerDiv.style.borderBottom = '1.5pt dashed #000000';
        rulerDiv.style.setProperty('mso-border-bottom-alt', '1.5pt dashed #000000');
      } else if (instructionRulerStyle === 2) {
        rulerDiv.style.borderBottom = '3pt double #000000';
        rulerDiv.style.setProperty('mso-border-bottom-alt', '3pt double #000000');
      } else if (instructionRulerStyle === 3) {
        rulerDiv.style.borderBottom = '4pt solid #334155';
        rulerDiv.style.setProperty('mso-border-bottom-alt', '4pt solid #334155');
      } else if (instructionRulerStyle === 4) {
        rulerDiv.style.borderBottom = '2pt solid #000000';
        rulerDiv.style.setProperty('mso-border-bottom-alt', '2pt solid #000000');
        const subRuler = document.createElement('div');
        subRuler.style.borderBottom = '0.5pt solid #000000';
        subRuler.style.marginTop = '2pt';
        rulerDiv.appendChild(subRuler);
      }
      headerSection.appendChild(rulerDiv);
    }
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
        }
        div.Section1 { 
          page: Section1; 
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
        }
        table { 
          mso-table-lspace:0pt; 
          mso-table-rspace:0pt; 
          border-collapse: collapse; 
          margin: 0; 
          width: 100%;
        }
        td { 
          font-family: "${fontFamily}", serif; 
          font-size: 12pt; 
          line-height: ${exactLineHeight}; 
          mso-line-height-rule: exactly; 
          padding: 0;
          vertical-align: top;
        }
        .header-row { background-color: #334155; color: white; text-align: center; font-weight: bold; padding: 10px; mso-shading: windowtext 0% #334155; }
      </style>
    </head>
    <body>
      <div class="Section1">
        <!-- Master Table for Paper Style Border -->
        <table border="0" cellspacing="0" cellpadding="0" width="100%" style="width: 100%; border-collapse: collapse; ${containerStyle}">
          <tr>
            <td style="padding: 10pt; ${shadingStyle}">
              ${headerDiv.innerHTML}
              ${metadataHtml}
              ${finalHtml}
            </td>
          </tr>
        </table>
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