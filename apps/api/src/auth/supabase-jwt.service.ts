import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { JWTPayload } from 'jose';
import type { RequestUser } from '../common/interfaces/request-user.interface';

type SupabasePayload = JWTPayload & {
  email?: string;
  app_metadata?: {
    business_id?: string;
    branch_id?: string;
    register_id?: string;
  };
};

@Injectable()
export class SupabaseJwtService {
  private jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

  constructor(private readonly configService: ConfigService) {}

  private getJwks() {
    if (this.jwks) {
      return this.jwks;
    }

    const supabaseUrl = this.configService.get<string>(
      'NEXT_PUBLIC_SUPABASE_URL',
    );

    if (!supabaseUrl) {
      throw new UnauthorizedException(
        'NEXT_PUBLIC_SUPABASE_URL es obligatorio para validar tokens de Supabase.',
      );
    }

    this.jwks = createRemoteJWKSet(
      new URL('/auth/v1/.well-known/jwks.json', supabaseUrl),
    );

    return this.jwks;
  }

  async verifyAccessToken(token: string): Promise<RequestUser> {
    const { payload } = await jwtVerify(token, this.getJwks());
    const typedPayload = payload as SupabasePayload;

    if (!typedPayload.sub) {
      throw new UnauthorizedException('Token de Supabase sin sujeto válido.');
    }

    return {
      id: typedPayload.sub,
      email: typedPayload.email ?? null,
      businessId: typedPayload.app_metadata?.business_id ?? null,
      branchId: typedPayload.app_metadata?.branch_id ?? null,
      registerId: typedPayload.app_metadata?.register_id ?? null,
    };
  }
}
