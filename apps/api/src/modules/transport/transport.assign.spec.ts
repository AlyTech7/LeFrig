import { describe, it, expect } from 'vitest';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { TransportController } from './transport.controller';

describe('TransportController assign roles', () => {
  it('PATCH assign exige admin o moderator', () => {
    const roles = Reflect.getMetadata(ROLES_KEY, TransportController.prototype.assignDriver);
    expect(roles).toEqual(['admin', 'moderator']);
  });
});
