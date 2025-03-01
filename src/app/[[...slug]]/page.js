import { ClientOnly } from './client';

export function generateStaticParams() {
  return [{ slug: [''] }, { slug: ['app'] }, { slug: ['login'] }];
}

export default function Page() {
  return <ClientOnly />;
} 