import { ResponsiveDialog } from '@/shared/ResponsiveDialog';
import type { ComponentProps } from 'react';
export function Dialog(props: ComponentProps<typeof ResponsiveDialog>) {
  return <ResponsiveDialog {...props} className="ct-dialog"/>;
}
