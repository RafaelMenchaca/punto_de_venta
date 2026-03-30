import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '../../common/enums/user-role.enum';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessAccessService } from './business-access.service';

describe('BusinessAccessService', () => {
  const queryRawMock = jest.fn();
  let service: BusinessAccessService;

  beforeEach(() => {
    queryRawMock.mockReset();
    service = new BusinessAccessService({
      $queryRaw: queryRawMock,
    } as unknown as PrismaService);
  });

  it('permite el acceso cuando el rol efectivo esta dentro de los roles admitidos', async () => {
    queryRawMock.mockResolvedValueOnce([{ role: UserRole.MANAGER }]);

    await expect(
      service.assertBusinessRole(
        'user-id',
        'business-id',
        [UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER],
        'branch-id',
      ),
    ).resolves.toBe(UserRole.MANAGER);
  });

  it('bloquea la accion cuando el rol efectivo no esta permitido', async () => {
    queryRawMock.mockResolvedValueOnce([{ role: UserRole.VIEWER }]);

    await expect(
      service.assertBusinessRole(
        'user-id',
        'business-id',
        [UserRole.OWNER, UserRole.ADMIN],
        'branch-id',
        'No tienes permiso para realizar esta accion.',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('bloquea la accion cuando no hay un rol activo para el alcance solicitado', async () => {
    queryRawMock.mockResolvedValueOnce([]);

    await expect(
      service.assertBusinessRole(
        'user-id',
        'business-id',
        [UserRole.CASHIER],
        'branch-id',
      ),
    ).rejects.toThrow('No tienes permiso para realizar esta accion.');
  });
});
