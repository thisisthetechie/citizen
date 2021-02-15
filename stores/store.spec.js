/* eslint-disable no-unused-expressions */
const { expect } = require('chai');

const {
  init,
  type,
  moduleDb,
  saveModule,
  findAllModules,
} = require('./store');
const { deleteDbAll } = require('../test/helper');

const storeTypes = ['mongodb', 'nedb'];

storeTypes.forEach((storeType) => {
  describe(`${storeType} store`, async () => {
    before(() => {
      init(storeType);
    });

    after(async () => {
      await deleteDbAll(moduleDb(), storeType);
    });

    it(`should use ${storeType}`, () => {
      expect(type()).to.equal(storeType);
    });

    describe('saveModule()', () => {
      after(async () => {
        await deleteDbAll(moduleDb(), storeType);
      });

      it('should store module meta', async () => {
        const result = await saveModule({
          namespace: 'store-hashicorp',
          name: 'store-consul',
          provider: 'store-aws',
          version: '0.1.0',
          owner: 'outsideris',
          location: 'store-hashicorp/store-consul/store-aws/0.1.0/module.tar.gz',
        });

        expect(result._id).to.exist; // eslint-disable-line no-underscore-dangle
        expect(result.name).to.equal('store-consul');
        expect(result.published_at).to.exist;
        expect(result.downloads).to.equal(0);
      });
    });

    describe('findAllModules()', () => {
      before(async () => {
        await saveModule({
          namespace: 'store-GCP', name: 'store-lb-http', provider: 'store-google', version: '1.0.4', owner: '',
        });
        await saveModule({
          namespace: 'store-aws-modules', name: 'store-vpc', provider: 'store-aws', version: '1.2.1', owner: '',
        });
        await saveModule({
          namespace: 'store-aws-modules', name: 'store-vpc', provider: 'store-aws', version: '1.5.0', owner: '',
        });
        await saveModule({
          namespace: 'store-aws-modules', name: 'store-vpc', provider: 'store-aws', version: '1.5.1', owner: '',
        });
      });

      after(async () => {
        await deleteDbAll(moduleDb(), storeType);
      });

      it('should return all modules', async () => {
        const result = await findAllModules();

        expect(result).to.have.property('modules').to.have.lengthOf(4);
        expect(result.modules[0]).to.have.property('namespace').to.equal('store-GCP');
      });

      it('should filter modules by namespace', async () => {
        const result = await findAllModules({
          namespace: 'store-aws-modules',
        });
        expect(result).to.have.property('modules').to.have.lengthOf(3);
        expect(result.modules[0]).to.have.property('namespace').to.equal('store-aws-modules');
      });

      it('should support pagination', async () => {
        const result = await findAllModules({ offset: 2, limit: 2 });
        expect(result).to.have.property('modules').to.have.lengthOf(2);
        expect(result.modules[0]).to.have.property('namespace').to.equal('store-aws-modules');
        expect(result.modules[0]).to.have.property('version').to.equal('1.5.0');
      });

      it('should return pagination information', async () => {
        const result = await findAllModules({ offset: 2, limit: 1 });

        expect(result).to.have.property('meta');
        expect(result.meta).to.have.property('limit').to.equal(1);
        expect(result.meta).to.have.property('currentOffset').to.equal(2);
        expect(result.meta).to.have.property('nextOffset').to.equal(3);
        expect(result.meta).to.have.property('prevOffset').to.equal(1);
      });

      it('should prevOffset pagination information', async () => {
        const result = await findAllModules({ offset: 0, limit: 2 });

        expect(result.meta).to.have.property('limit').to.equal(2);
        expect(result.meta).to.have.property('currentOffset').to.equal(0);
        expect(result.meta).to.have.property('nextOffset').to.equal(2);
        expect(result.meta).to.have.property('prevOffset').to.be.null;
      });

      it('should return pagination information', async () => {
        const result = await findAllModules({ offset: 2, limit: 2 });

        expect(result.meta).to.have.property('limit').to.equal(2);
        expect(result.meta).to.have.property('currentOffset').to.equal(2);
        expect(result.meta).to.have.property('nextOffset').to.be.null;
        expect(result.meta).to.have.property('prevOffset').to.equal(0);
      });

      it('should filter modules by provider', async () => {
        const result = await findAllModules({
          provider: 'store-aws',
        });
        expect(result).to.have.property('modules').to.have.lengthOf(3);
        expect(result.modules[0]).to.have.property('namespace').to.equal('store-aws-modules');
      });
    });
  });
});
