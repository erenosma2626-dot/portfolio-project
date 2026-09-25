import Link from "next/link";
import { Row } from "@/components/monograph";
import { content } from "@/content";

const { notFound, common, nav } = content;

export default function NotFound() {
  return (
    <div className="text-navy">
      <article className="mx-auto flex min-h-[80vh] max-w-5xl flex-col justify-center px-5 py-32 sm:px-8">
        <Row margin={<span className="font-heading text-base font-bold">404</span>}>
          <h1 className="text-4xl leading-tight sm:text-5xl">{notFound.title}</h1>
          <p className="mt-6 max-w-[62ch] text-lg leading-[1.75]">
            <span className="font-heading font-bold">{notFound.lemmaLabel}</span>{" "}
            <span className="italic">{notFound.lemma}</span>
          </p>
          <p className="mt-3 max-w-[62ch] leading-relaxed opacity-80">
            <span className="italic">{notFound.proofLabel}</span> {notFound.proof}
          </p>
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <Link href="/" className="link-underline">
              {common.home}
            </Link>
            <Link href="/about" className="link-underline">
              §1 {nav.labels.about}
            </Link>
            <Link href="/projects" className="link-underline">
              §2 {nav.labels.projects}
            </Link>
          </div>
        </Row>
      </article>
    </div>
  );
}
