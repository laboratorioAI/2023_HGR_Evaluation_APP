import katex from 'katex';


export default function MyComponent() {
    const latexCode = `
\\begin{tabular}{|c|c|}
  \\hline
  Column 1 & Column 2 \\\\ \\hline
  Item 1 & Item 2 \\\\ \\hline
\\end{tabular}
`;
    const htmlCode = katex.renderToString(latexCode, { displayMode: true });
    return <div dangerouslySetInnerHTML={{ __html: htmlCode }} />;
}
