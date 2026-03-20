import ClientPage from './_client';

export function generateStaticParams() {
  return [{ programId: '_' }];
}

export default function Page({ params }: { params: { programId: string } }) {
  return <ClientPage params={params} />;
}
