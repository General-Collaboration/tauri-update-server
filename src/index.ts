import express from 'express';
import { compare } from 'compare-versions';
import { github } from '../lib/github.js';
import { getReleases } from '../lib/getReleases.js';
import { template } from '../lib/template.js';
import type { Request, Response } from 'express';

const app = express();

interface Parameters {
    current_version: string;
    target: string;
    arch: string;
}

app.get('/', async (req: Request<{}, {}, {}, Parameters>, res: Response) => {
    if (req.query.current_version && req.query.target && req.query.arch) {
        const releases = await github();
        const latest = releases.find((release) => {
            return release.tag_name?.startsWith(process.env.TAG_STRUCTURE);
        });
        if (compare(latest.tag_name.replace('app-', ''), req.query.current_version, '>')) {
            const version = process.env.TAG_STRUCTURE ? latest.tag_name.split(process.env.TAG_STRUCTURE)[1] : latest.tag_name;
            const release = getReleases(latest.assets, req.query.target, req.query.arch);
            if (Object.keys(release).length !== 0) {
                res.status(200).send(await template(release, version, req.query.current_version));
            } else {
                res.status(204).send();
            }
        } else {
            res.status(204).send();
        }
    } else {
        res.status(400).send({
            message: 'Invalid request',
        });
    }
});

interface RouteParams {
    arch: string;
    version: string;
}

app.get('/darwin/:arch/:version', async (req: Request<RouteParams, {}, {}, Parameters>, res: Response) => {
    if (req.params.arch) {
        const releases = await github();
        const latest = releases.find((release) => {
            return release.tag_name?.startsWith(process.env.TAG_STRUCTURE);
        });
        if (latest) {
            const version = process.env.TAG_STRUCTURE ? latest.tag_name.split(process.env.TAG_STRUCTURE)[1] : latest.tag_name;
            const release = getReleases(latest.assets, 'darwin', req.params.arch);
            if (Object.keys(release).length !== 0) {
                res.status(200).send(await template(release, version, 'darwin'));
            } else {
                res.status(204).send();
            }
        } else {
            res.status(204).send();
        }
    } else {
        res.status(400).send({
            message: 'Invalid request',
        });
    }
});

app.listen(parseInt(process.env.PORT, 10) || 8080, '0.0.0.0', () => console.log(`Server started at http://0.0.0.0:8080/`));
