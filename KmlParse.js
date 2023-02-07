import parseKml from 'parse-kml';

export default class KmlParse {
    constructor(kmlFilePath) {
        this.kmlFilePath = kmlFilePath;
        this.points = [];
        this.lines = [];
        this.bounds = [];
        return this;
    }

    async parse(kmlFilePath) {
        this.kmlJson = await new Promise((resolve, reject) => {
            parseKml.toJson(kmlFilePath || this.kmlFilePath)
                .then(kml => resolve(kml)).catch(err => reject(err));
        });

        this.eachLayer(this.kmlJson);

        return this;
    }

    eachLayer(element) {
        if (element.hasOwnProperty("features")) {
            element.features.forEach((childLayer) => {
                this.eachLayer(childLayer);
            });
            return;
        }
        this.allocateLayer(element);
    }

    allocateLayer(layer) {
        if (!layer.hasOwnProperty('geometry')) {
            return;
        }

        if (layer.geometry.type === 'Point') {
            this.points.push({
                coordinates: layer.geometry.coordinates,
                properties: layer.properties
            });
            this.bounds = [...this.bounds, layer.geometry.coordinates];
        }

        if (layer.geometry.type === 'LineString') {
            this.lines.push({
                coordinates: layer.geometry.coordinates,
                properties: layer.properties
            });

            this.bounds = [...this.bounds, ...layer.geometry.coordinates];
        }
    }

    getSquare() {
        const lats = this.bounds.map(b => b[0]);
        const lngs = this.bounds.map(b => b[1]);
        return [
            [Math.min.apply(null, lats), Math.min.apply(null, lngs)],
            [Math.max.apply(null, lats), Math.max.apply(null, lngs)]
        ]
    }


}