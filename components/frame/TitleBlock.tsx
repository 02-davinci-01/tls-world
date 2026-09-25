import s from './frame.module.css';

type Props = { layer: string; title: string; subject: string; revision: string };

export function TitleBlock({ layer, title, subject, revision }: Props) {
  const cells: [string, string][] = [
    ['layer', `${layer} of 04`],
    ['title', title],
    ['subject', subject],
    ['revision', revision],
    ['drawn by', '02-davinci-01'],
  ];
  return (
    <div className={s.tb}>
      {cells.map(([k, v]) => (
        <div key={k}>
          <span>{k}</span>
          {v}
        </div>
      ))}
    </div>
  );
}
