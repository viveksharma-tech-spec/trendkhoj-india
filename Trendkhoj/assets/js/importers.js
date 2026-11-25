/**
 * TrendKhoj India - Data Importers & Parsers
 * 
 * Supports:
 * 1. Robust CSV Parsing with Column Mapping & Row Validation
 * 2. Transparent RSS/Atom Feed Import with CORS explanations
 * 3. Safe Manual XML/RSS Paste Workflow
 * 
 * Adheres strictly to data authenticity:
 * - Never fabricates timestamps or search volumes
 * - Tags imported data accurately with origin metadata
 * - Never scrapes live pages unauthorized
 */

(function (window) {
  'use strict';

  // Helper to sanitize text preventing script injection
  function escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Robust RFC-4180 compliant CSV line tokenizer
  function parseCSV(text) {
    const lines = [];
    let row = [];
    let inQuotes = false;
    let token = '';

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          token += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(token.trim());
        token = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++; // handle CRLF
        }
        row.push(token.trim());
        if (row.some(field => field.length > 0)) {
          lines.push(row);
        }
        row = [];
        token = '';
      } else {
        token += char;
      }
    }

    if (token.length > 0 || row.length > 0) {
      row.push(token.trim());
      if (row.some(field => field.length > 0)) {
        lines.push(row);
      }
    }

    return lines;
  }

  const Importers = {
    /**
     * Inspects a CSV file string and returns headers + preview rows.
     */
    inspectCSV(csvText) {
      const rows = parseCSV(csvText);
      if (!rows || rows.length < 2) {
        throw new Error('CSV file must have at least one header row and one data row.');
      }

      const headers = rows[0];
      const previewRows = rows.slice(1, 4);

      // Auto-detect recommended column indices
      const detected = {
        titleIndex: -1,
        categoryIndex: -1,
        volumeIndex: -1,
        sourceNameIndex: -1,
        sourceUrlIndex: -1,
        timestampIndex: -1,
        statusIndex: -1
      };

      headers.forEach((h, idx) => {
        const clean = h.toLowerCase().trim();
        if (detected.titleIndex === -1 && /^(topic|title|name|query|keyword|trend)$/i.test(clean)) {
          detected.titleIndex = idx;
        } else if (detected.titleIndex === -1 && /(topic|title|name)/i.test(clean)) {
          detected.titleIndex = idx;
        }

        if (detected.categoryIndex === -1 && /(cat|category|genre|type|domain)/i.test(clean)) {
          detected.categoryIndex = idx;
        }

        if (detected.volumeIndex === -1 && /(vol|volume|search|searches|interest|count)/i.test(clean)) {
          detected.volumeIndex = idx;
        }

        if (detected.sourceUrlIndex === -1 && /(url|link|href|site|source_url)/i.test(clean)) {
          detected.sourceUrlIndex = idx;
        }

        if (detected.sourceNameIndex === -1 && /(source|publisher|portal|provider)/i.test(clean) && !/(url|link)/i.test(clean)) {
          detected.sourceNameIndex = idx;
        }

        if (detected.timestampIndex === -1 && /(time|date|timestamp|pubdate|updated|created)/i.test(clean)) {
          detected.timestampIndex = idx;
        }

        if (detected.statusIndex === -1 && /(status|state|active)/i.test(clean)) {
          detected.statusIndex = idx;
        }
      });

      // Fallback: If titleIndex still not detected, pick column 0
      if (detected.titleIndex === -1 && headers.length > 0) {
        detected.titleIndex = 0;
      }

      return {
        headers,
        totalDataRows: rows.length - 1,
        previewRows,
        detectedMapping: detected,
        rawRows: rows
      };
    },

    /**
     * Processes CSV rows given a verified mapping configuration and validates data.
     */
    processMappedCSV(rawRows, mapping, fileName = 'Imported_Data.csv') {
      const headers = rawRows[0];
      const dataRows = rawRows.slice(1);

      const validItems = [];
      const errorLog = [];

      dataRows.forEach((row, rowIdx) => {
        const rowNum = rowIdx + 2; // account for 1-based index and header
        const rawTitle = mapping.titleIndex >= 0 ? (row[mapping.titleIndex] || '') : '';
        const title = rawTitle.trim();

        if (!title) {
          errorLog.push(`Row ${rowNum}: Skipped because topic title is blank.`);
          return;
        }

        const category = mapping.categoryIndex >= 0 && row[mapping.categoryIndex] 
          ? row[mapping.categoryIndex].trim() 
          : 'General';

        const rawVolume = mapping.volumeIndex >= 0 && row[mapping.volumeIndex] 
          ? row[mapping.volumeIndex].trim() 
          : null;

        const sourceName = mapping.sourceNameIndex >= 0 && row[mapping.sourceNameIndex]
          ? row[mapping.sourceNameIndex].trim()
          : 'CSV Import';

        let sourceUrl = mapping.sourceUrlIndex >= 0 && row[mapping.sourceUrlIndex]
          ? row[mapping.sourceUrlIndex].trim()
          : '';

        if (sourceUrl && !/^https?:\/\//i.test(sourceUrl)) {
          sourceUrl = 'https://' + sourceUrl;
        }

        // Validate timestamp: only use if supplied by user
        let timestamp = null;
        if (mapping.timestampIndex >= 0 && row[mapping.timestampIndex]) {
          const rawTime = row[mapping.timestampIndex].trim();
          const parsed = Date.parse(rawTime);
          if (!isNaN(parsed)) {
            timestamp = new Date(parsed).toISOString();
          } else {
            errorLog.push(`Row ${rowNum}: Unrecognized date format '${rawTime}'. Timestamp omitted.`);
          }
        }

        // Status: only when supplied by source
        const status = mapping.statusIndex >= 0 && row[mapping.statusIndex]
          ? row[mapping.statusIndex].trim()
          : null;

        validItems.push({
          id: `csv-${Date.now()}-${rowIdx}`,
          title: title,
          category: category,
          sourceName: sourceName,
          sourceUrl: sourceUrl || 'https://trends.google.com/trending?geo=IN',
          timestamp: timestamp, // null if not supplied
          searchVolume: rawVolume || null, // null if not supplied
          status: status || null,
          summary: `Topic imported from CSV file "${fileName}".`,
          relatedKeywords: [title, category],
          isDemo: false,
          dataOrigin: `Imported CSV (${fileName})`
        });
      });

      return {
        items: validItems,
        totalProcessed: dataRows.length,
        validCount: validItems.length,
        errorCount: errorLog.length,
        errors: errorLog
      };
    },

    /**
     * Parses an RSS / Atom XML string into TrendKhoj topic objects.
     */
    parseRSSXML(xmlText, originUrlOrLabel = 'Manual RSS Feed') {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

      // Check for parsing errors
      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        throw new Error('Failed to parse XML content. Please check feed format.');
      }

      const items = [];
      const errorLog = [];

      // Check standard RSS <item> tags
      let xmlItems = xmlDoc.querySelectorAll('item');

      // Check Atom <entry> tags if RSS items empty
      if (!xmlItems || xmlItems.length === 0) {
        xmlItems = xmlDoc.querySelectorAll('entry');
      }

      if (!xmlItems || xmlItems.length === 0) {
        throw new Error('No <item> or <entry> elements found in this RSS feed.');
      }

      xmlItems.forEach((node, idx) => {
        try {
          const titleElem = node.querySelector('title');
          const title = titleElem ? titleElem.textContent.trim() : '';

          if (!title) {
            errorLog.push(`Item ${idx + 1}: Missing <title> tag. Skipped.`);
            return;
          }

          // Link
          const linkElem = node.querySelector('link');
          let link = '';
          if (linkElem) {
            link = linkElem.getAttribute('href') || linkElem.textContent.trim();
          }

          // Publication date / timestamp
          const pubDateElem = node.querySelector('pubDate') || node.querySelector('updated') || node.querySelector('dc\\:date');
          let timestamp = null;
          if (pubDateElem && pubDateElem.textContent) {
            const parsedTime = Date.parse(pubDateElem.textContent.trim());
            if (!isNaN(parsedTime)) {
              timestamp = new Date(parsedTime).toISOString();
            }
          }

          // Google Trends RSS specific tag: <ht:approx_traffic>
          const trafficElem = node.getElementsByTagNameNS('https://trends.google.com/trending/rss', 'approx_traffic')[0] 
            || node.querySelector('approx_traffic')
            || node.querySelector('ht\\:approx_traffic');
          
          let searchVolume = null;
          if (trafficElem && trafficElem.textContent) {
            const trafficText = trafficElem.textContent.trim();
            if (trafficText) {
              searchVolume = trafficText.endsWith('+') ? trafficText : `${trafficText}+ searches`;
            }
          }

          // Description or snippet
          const descElem = node.querySelector('description') || node.querySelector('summary') || node.querySelector('content');
          let summary = descElem ? descElem.textContent.trim() : '';
          // Strip inner HTML tags from summary if any
          summary = summary.replace(/<[^>]*>?/gm, '').slice(0, 240);
          if (summary.length === 240) summary += '...';

          // Category
          const catElem = node.querySelector('category');
          let category = catElem ? catElem.textContent.trim() : 'General';

          items.push({
            id: `rss-${Date.now()}-${idx}`,
            title: title,
            category: category,
            sourceName: 'RSS Feed Source',
            sourceUrl: link || 'https://trends.google.com/trending?geo=IN',
            timestamp: timestamp, // only real timestamp if provided
            searchVolume: searchVolume, // only real if supplied by feed tag
            status: 'Active',
            summary: summary || `Item discovered from feed: ${originUrlOrLabel}`,
            relatedKeywords: [title, category],
            isDemo: false,
            dataOrigin: `RSS Feed (${originUrlOrLabel})`
          });
        } catch (err) {
          errorLog.push(`Item ${idx + 1}: Parse warning - ${err.message}`);
        }
      });

      return {
        items,
        totalItems: items.length,
        errors: errorLog
      };
    },

    /**
     * Fetches an external RSS URL using client-side fetch or CORS proxy.
     */
    async fetchRemoteRSS(feedUrl, corsProxyMode = 'allorigins') {
      if (!feedUrl || !/^https?:\/\//i.test(feedUrl)) {
        throw new Error('Please enter a valid HTTP or HTTPS feed URL.');
      }

      let fetchUrl = feedUrl;
      if (corsProxyMode === 'allorigins') {
        fetchUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(feedUrl)}`;
      } else if (corsProxyMode === 'corsproxy_io') {
        fetchUrl = `https://corsproxy.io/?url=${encodeURIComponent(feedUrl)}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 second timeout

      try {
        const response = await fetch(fetchUrl, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/rss+xml, application/xml, text/xml, */*'
          }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
        }

        const xmlText = await response.text();
        return this.parseRSSXML(xmlText, feedUrl);
      } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
          throw new Error('The request timed out. External feeds or public CORS proxies may be slow or blocking direct requests.');
        }
        throw new Error(`CORS or Network Fetch Failed: ${err.message}. Please use the safe manual XML paste tab instead.`);
      }
    }
  };

  window.TrendKhojImporters = Importers;
})(window);
