import { Role } from '@prisma/client';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

/**
 * Determines the serialization groups for a user based on their role and context.
 * * @param requestingUser The user making the request
 * @param requestingUser user doing the request
 * @param targetResource (Optional) The specific resource being accessed, for ownership checks
 * @returns Array of serialization groups (e.g., ['public', 'privileged'])
 */
export function getSerializationGroups(
  requestingUser: AuthenticatedRequest['user'],
  targetResource?: { id: number } | { ownerId: number },
): string[] {
  const groups = ['public']; // Everyone gets public data

  // Role-Based Groups
  if (requestingUser.role === Role.MANAGER) {
    groups.push('privileged');
  }
  if (requestingUser.role === Role.ADMIN) {
    groups.push('privileged', 'confidential');
  }

  // Context-Based Groups (Ownership)
  if (targetResource) {
    let isOwner = false;

    // Check 'id' (User Profile)
    if ('id' in targetResource && targetResource.id === requestingUser.id) {
      isOwner = true;
    }
    // Check 'ownerId' (Document/Resource)
    else if (
      'ownerId' in targetResource &&
      (targetResource as any).ownerId === requestingUser.id
    ) {
      isOwner = true;
    }

    if (isOwner) {
      // Owners typically get full access to their own data
      groups.push('privileged', 'confidential');
    }
  }

  // Deduplicate groups
  return [...new Set(groups)];
}
