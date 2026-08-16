export default function TableEmptyState({ colSpan, message }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-6 text-center text-sm text-slate-400">
        {message}
      </td>
    </tr>
  )
}
