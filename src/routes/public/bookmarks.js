import { Router }                              from 'express';
import models, { Sequelize }                   from '../../models';
import validate                                from 'validate.js';
import { limitConstraints, offsetConstraints } from '../../validators/basic';
import { linkConstraints }                     from '../../validators/bookmark';
import request                                 from 'request';

//For get OG:
import grabity from 'grabity';

const Op = Sequelize.Op;
const router = Router();

//TODO: Написать документацию


router.get('/', async (req, res) => {
  try {
    
    const {
      limit,
      offset,
      filter,
      filter_value,
      filter_from,
      filter_to,
      sort_by,
      sort_dir
    } = req.query;
    
    const validationResult = validate({ limit, offset }, {
      limit: limitConstraints,
      offset: offsetConstraints
    });
    
    if (validationResult) {
      res.status(400).json({ errors: validationResult });
      return;
    }
    
    const filterObj = () => {
      if (filter) {
        switch (filter) {
          case 'favorites':
            return filter_value
              ? { favorites: filter_value === 'true' }
              : {};
          case 'createdAt':
            return (filter_from && filter_to)
              ? {
                createdAt: {
                  [Op.and]: {
                    [Op.gte]: new Date(+filter_from),
                    [Op.lte]: new Date(+filter_to)
                  }
                }
              }
              : {};
        }
      } else {
        return {};
      }
    };
    
    const { count: length, rows: data } = await models.bookmark.findAndCountAll({
      attributes: { exclude: ['updatedAt'] },
      limit: limit || 50,
      offset: offset || 0,
      where: filterObj(),
      order: [
        [sort_by || 'createdAt', sort_dir || 'ASC']
      ]
    });
    
    res.json({ length, data });
    
  } catch (error) {
    res.status(400).json({ errors: { backend: ['Can\'t get list of bookmarks', error] } });
  }
});


router.get('/:guid', async (req, res) => {
  try {
    
    const { guid } = req.params;
    const find = await models.bookmark.findByPk(guid);
    
    if (find) {
      const url = find.link;
      const whois = `http://htmlweb.ru/analiz/api.php?whois&url=${url}&json`;
      const data = {};
      
      const fetchWhois = new Promise(resolve => {
        request(whois, (error, response, body) => {
          if (error) {
            data.info = { error: error.message };
          }
          if (response && response.statusCode === 200) {
            data.info = JSON.parse(body);
          }
          resolve();
        });
      });
      
      const fetchOG = grabity.grabIt(url)
        .then(res => data.og = res)
        .catch(e => data.og = { error: e.message });
      
      
      Promise.all([fetchWhois, fetchOG]).then(() => res.json(data));
      
    } else {
      res.status(404).json('Bookmark with current ID Not Found');
    }
    
  } catch (error) {
    res.status(400).json({ errors: { backend: ['Can\'t get information', error.message] } });
  }
});


router.post('/', async (req, res) => {
  try {
    
    const { link, description, favorites } = req.body;
    
    const validationResult = validate({ link }, {
      link: linkConstraints
    });
    
    if (validationResult) {
      res.status(400).json({ errors: [...validationResult.link] });
      return;
    }
    
    const bookmark = await models.bookmark.create({
      link,
      description,
      favorites
    });
    
    res.status(201).json({
      data: {
        guid: bookmark.guid,
        createdAt: bookmark.createdAt
      }
    });
    
  } catch (error) {
    res.status(400).json({ errors: { backend: ['Can\'t add new bookmark', error] } });
  }
});


router.patch('/:guid', async (req, res) => {
  try {
    
    const { guid } = req.params;
    const { link } = req.body;
    
    const validationResult = validate({ link }, {
      link: linkConstraints(link)
    });
    
    if (link && validationResult) {
      res.status(400).json({ errors: [...validationResult.link] });
      return;
    }
    
    const find = await models.bookmark.findByPk(guid);
    
    if (find) {
      await models.bookmark.update(
        req.body,
        { where: { guid } }
      );
    } else {
      res.status(404).json('Bookmark with current ID Not Found');
      return;
    }
    
    res.status(200).json('Updating was successful');
    
  } catch (error) {
    res.status(400).json({ errors: { backend: ['Can\'t update bookmark', error] } });
  }
});


router.delete('/:guid', async (req, res) => {
  try {
    
    const { guid } = req.params;
    
    const find = await models.bookmark.findByPk(guid);
    
    if (find) {
      await models.bookmark.destroy(
        { where: { guid } }
      );
    } else {
      res.status(404).json('Bookmark with current ID Not Found');
      return;
    }
    
    res.status(200).json('Deleting was successful');
    
  } catch (error) {
    res.status(400).json({ errors: { backend: ['Can\'t delete bookmark', error] } });
  }
});


export default router;
