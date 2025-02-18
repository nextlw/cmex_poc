import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';
import YAML from 'yamljs';

const swaggerDocument = YAML.load(path.join(__dirname, './swagger.yaml'));

const options = {
  definition: swaggerDocument,
  apis: [path.join(__dirname, './server.ts')],
};

export const specs = swaggerJsdoc(options); 