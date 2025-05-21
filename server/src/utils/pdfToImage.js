const { PdfConverter } = require('pdf-poppler');
const path = require('path');
const fs = require('fs');

/**
 * Convert the first page of a PDF to a high-resolution PNG.
 * @param {string} pdfPath - Absolute path to the PDF file.
 * @param {string} outputDir - Directory to save the PNG.
 * @param {string} [outputName] - Optional output file name (without extension).
 * @returns {Promise<string>} - Resolves to the PNG file path.
 */
async function convertPdfToPng(pdfPath, outputDir, outputName = null) {
  if (!fs.existsSync(pdfPath)) throw new Error('PDF file does not exist: ' + pdfPath);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const baseName = outputName || path.basename(pdfPath, path.extname(pdfPath));
  const outputFile = path.join(outputDir, `${baseName}-page1.png`);

  const options = {
    format: 'png',
    out_dir: outputDir,
    out_prefix: baseName,
    page: 1,
    scale: 300, // 300 DPI for print quality
    // width: 2480, // A4 at 300 DPI (landscape: 3508x2480)
    // height: 3508,
  };

  try {
    await PdfConverter.convert(pdfPath, options);
    // pdf-poppler outputs as <out_dir>/<out_prefix>-1.png
    const generated = path.join(outputDir, `${baseName}-1.png`);
    if (fs.existsSync(generated)) {
      fs.renameSync(generated, outputFile);
      return outputFile;
    } else if (fs.existsSync(outputFile)) {
      return outputFile;
    } else {
      throw new Error('PNG not generated as expected.');
    }
  } catch (err) {
    throw new Error('PDF to PNG conversion failed: ' + err.message);
  }
}

module.exports = { convertPdfToPng }; 