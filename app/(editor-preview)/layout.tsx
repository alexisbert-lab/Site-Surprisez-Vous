import { EditModeProvider } from '@/lib/edit-mode-context';
import { IframeEditProvider } from '@/lib/iframe-edit-context';

export default function EditorPreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <EditModeProvider>
      <IframeEditProvider>
        {children}
      </IframeEditProvider>
    </EditModeProvider>
  );
}
