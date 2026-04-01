import { JwtMiddleware } from './jwt.middleware';
import * as jwt from 'jsonwebtoken';

const SECRET = 'test-secret';

describe('JwtMiddleware', () => {
  let middleware: JwtMiddleware;
  const mockNext = jest.fn();

  beforeEach(() => {
    process.env.SUPABASE_JWT_SECRET = SECRET;
    middleware = new JwtMiddleware();
    mockNext.mockClear();
  });

  it('유효한 토큰이면 user를 req에 붙인다', () => {
    const token = jwt.sign({ sub: 'user-1', email: 'test@test.com' }, SECRET);
    const req: any = { headers: { authorization: `Bearer ${token}` } };

    middleware.use(req, {} as any, mockNext);

    expect(req.user).toMatchObject({ sub: 'user-1', email: 'test@test.com' });
    expect(mockNext).toHaveBeenCalled();
  });

  it('유효하지 않은 토큰이면 user를 null로 설정한다', () => {
    const req: any = { headers: { authorization: 'Bearer invalid.token.here' } };

    middleware.use(req, {} as any, mockNext);

    expect(req.user).toBeNull();
    expect(mockNext).toHaveBeenCalled();
  });

  it('Authorization 헤더가 없으면 user를 null로 설정한다', () => {
    const req: any = { headers: {} };

    middleware.use(req, {} as any, mockNext);

    expect(req.user).toBeNull();
    expect(mockNext).toHaveBeenCalled();
  });
});
