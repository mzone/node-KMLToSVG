import fs from 'fs';
import inquirer from 'inquirer';
import parseKml from './KmlParse.js';

const ZOOM_LEVEL = 10000;
const CIRCLE_R = 5;

const answers = await new Promise((resolve, reject) => {
    inquirer
        .prompt([
            {
                name: 'kmlFilePath',
                message: 'Enter KML file path: ',
                default: null
            },
            {
                name: 'exportFileName',
                message: 'Enter export file name: ',
                default: null
            },
        ])
        .then(answers => {
            resolve(answers);
        });
});

answers.kmlFilePath = answers.kmlFilePath.trim();

if (!answers.kmlFilePath) {
    throw Error('KML file path not found...');
}

const kml = await new parseKml(answers.kmlFilePath).parse();

const matchedFileName = answers.kmlFilePath.match(/^(?:[^:\/?#]+:)?(?:\/\/[^\/?#]*)?(?:([^?#]*\/)([^\/?#]*))?(\?[^#]*)?(?:#.*)?$/) ?? [];
const [, dir, fileName, query] = matchedFileName.map(match => match ?? '');

const square = kml.getSquare();
const svgWidth = Math.floor(square[1][0] * ZOOM_LEVEL - square[0][0] * ZOOM_LEVEL);
const svgHeight = Math.floor(square[1][1] * ZOOM_LEVEL - square[0][1] * ZOOM_LEVEL);

const polylines = kml.lines.map(i => {
    const point = i.coordinates.map(c => {
        return (c[0] - square[0][0]) * ZOOM_LEVEL + ',' + (c[1] - square[0][1]) * ZOOM_LEVEL;
    });
    return `<polyline class="st0" points="${point.join(' ')}"/>`;
});

const points = kml.points.map(i => {
    const point = i.coordinates;
    return `<circle class="st0" cx="${(point[0] - square[0][0]) * ZOOM_LEVEL}" cy="${(point[1] - square[0][1]) * ZOOM_LEVEL}" r="${CIRCLE_R}"/>`;
});

const svgFile = `<?xml version="1.0" encoding="utf-8"?>
<!-- Generator: Adobe Illustrator 27.2.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->
<svg version="1.1" id="klm2SVG" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px"
	 y="0px" viewBox="0 0 ${svgWidth} ${svgHeight}" style="enable-background:new 0 0 ${svgWidth} ${svgHeight};" xml:space="preserve">
<style type="text/css">
	.st0{fill:#FFFFFF;stroke:#000000;stroke-miterlimit:10;}
</style>
${polylines.join('')}
${points.join('')}
</svg>`;

fs.writeFile(dir + (answers.exportFileName || fileName) + '.svg', svgFile, function (err, data) {
    if (err) throw err;
});

console.log("Operation completed.");
