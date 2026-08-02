import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { appConfig } from './config';
import { errorHandler, notFoundHandler } from './middleware';
import { createRoutes } from './routes';
import { createSuccessResponse } from './utils/response';

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

export const createExpressApp = (): Express => {
  const app = express();
  app.set('json replacer', (key: string, value: any) =>
    typeof value === 'bigint' ? value.toString() : value
  );

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors());
  app.use(morgan('dev'));
  app.use((req, res, next) => {
    if (req.originalUrl.includes('/webhook')) {
      express.raw({ type: 'application/json' })(req, res, (err) => {
        if (err) return next(err);
        (req as any).rawBody = req.body;
        try {
          req.body = JSON.parse(req.body.toString());
        } catch (error) {
          req.body = {};
        }
        next();
      });
    } else {
      express.json()(req, res, next);
    }
  });
  app.use(express.urlencoded({ extended: true }));

  app.get('/', (_request, response) => {
    response.status(200).json(
      createSuccessResponse('Videon API is running', {
        environment: appConfig.environment,
        service: 'videon-server',
      })
    );
  });

  app.get(`${appConfig.apiPrefix}/health`, (_request, response) => {
    response.status(200).json({ status: 'ok', message: 'Healthy' });
  });

  app.use(appConfig.apiPrefix, createRoutes());
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
