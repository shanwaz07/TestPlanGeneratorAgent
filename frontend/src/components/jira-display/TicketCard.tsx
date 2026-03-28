import { Tag, User, Paperclip, ClipboardList } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge, priorityBadge } from '../ui/Badge';
import { JiraTicket } from '../../services/api';

export function TicketCard({ ticket }: { ticket: JiraTicket }) {
  return (
    <Card>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-3 mb-4 border-b-2 border-stellar-blue">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-stellar-blue bg-stellar-blue-light px-2 py-0.5 rounded font-mono">
              {ticket.key}
            </span>
            {priorityBadge(ticket.priority)}
            <Badge variant="default">{ticket.status}</Badge>
          </div>
          <h3 className="text-cosmic-indigo font-bold text-base">{ticket.summary}</h3>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        {/* Description */}
        {ticket.description && (
          <div className="col-span-2">
            <p className="text-xs font-semibold text-cosmic-indigo uppercase tracking-wide mb-1">Description</p>
            <p className="text-dark-matter text-sm leading-relaxed line-clamp-4 bg-lunar-mist rounded p-2.5">
              {ticket.description}
            </p>
          </div>
        )}

        {/* Acceptance Criteria */}
        {ticket.acceptanceCriteria && (
          <div className="col-span-2">
            <div className="flex items-center gap-1.5 mb-1">
              <ClipboardList size={12} className="text-stellar-blue" />
              <p className="text-xs font-semibold text-cosmic-indigo uppercase tracking-wide">Acceptance Criteria</p>
            </div>
            <div className="callout-info text-sm text-dark-matter whitespace-pre-wrap">
              {ticket.acceptanceCriteria}
            </div>
          </div>
        )}

        {/* Assignee */}
        {ticket.assignee && (
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <User size={12} className="text-gray-400" />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Assignee</p>
            </div>
            <p className="text-dark-matter">{ticket.assignee}</p>
          </div>
        )}

        {/* Labels */}
        {ticket.labels.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Tag size={12} className="text-gray-400" />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Labels</p>
            </div>
            <div className="flex flex-wrap gap-1">
              {ticket.labels.map(l => (
                <Badge key={l} variant="purple">{l}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Attachments */}
        {ticket.attachments.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Paperclip size={12} className="text-gray-400" />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Attachments ({ticket.attachments.length})</p>
            </div>
            <div className="space-y-1">
              {ticket.attachments.map(a => (
                <a key={a.url} href={a.url} target="_blank" rel="noreferrer"
                  className="text-stellar-blue text-xs hover:underline block truncate">{a.filename}</a>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
