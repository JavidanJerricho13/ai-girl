import { IsOptional, IsUUID } from 'class-validator';

export class LinkGuestDto {
  // Optional — backend also falls back to the guest-id cookie. We accept it
  // in the body too so a mobile client (no cookies) can drive linking.
  @IsOptional()
  @IsUUID()
  guestId?: string;
}
