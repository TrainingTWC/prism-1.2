import ClientPage from './_client';

export function generateStaticParams() {
  return [{ id: '_' }];
}

export default function Page({ params }: { params: { id: string } }) {
  return <ClientPage params={params} />;
}
