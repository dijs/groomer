'use strict';

import express from 'express';
import bodyParser from 'body-parser';
import Pivotal from 'pivotaljs';

let port = process.env.PORT || 3000;

let pivotal = new Pivotal(process.env.PIVOTAL_API_KEY);

let app = express();

app.use(express.static(`${__dirname}/../public`));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/info', (req, res, next) => {
	pivotal.getStory(req.query.storyId, (err, result) => {
		if (err || result.error) {
			next(err || new Error(result.error));
		} else {
			res.json(result);
		}
	});
});

app.post('/estimate', (req, res, next) => {
	pivotal.updateStory(req.body.projectId, req.body.storyId, {
		estimate: parseInt(req.body.estimate)
	}, (err, result) => {
		if (err || result.error) {
			next(err || new Error(result.error));
		} else {
			res.json({
				success: true
			});
		}
	});
});

app.post('/prioritize', (req, res, next) => {
	pivotal.addStoryLabel(req.body.projectId, req.body.storyId, req.body.priority, (err, result) => {
		if (err || result.error) {
			next(err || new Error(result.error));
		} else {
			res.json({
				success: true
			});
		}
	});
});

app.listen(port, () => console.log(`Groomer started @ http:\/\/localhost:${port}`));
