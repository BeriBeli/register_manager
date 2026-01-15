
import { useState, useEffect, useMemo } from "react";
import { Search, X, Layers, Box, Cpu } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useRegisterStore } from "../../stores/registerStore";
import type { Project, AddressBlock, Register, Field } from "@register-manager/shared";

interface GlobalSearchDialogProps {
  onClose: () => void;
}

interface SearchResult {
  id: string;
  type: "addressBlock" | "register" | "field";
  name: string;
  description?: string;
  parentName?: string;
  // Context for navigation
  memoryMapId?: string;
  addressBlockId?: string;
  register?: Register;
}

export function GlobalSearchDialog({ onClose }: GlobalSearchDialogProps) {
  const { t } = useTranslation();
  const currentProject = useRegisterStore((state) => state.currentProject);
  const setSelectedAddressBlockId = useRegisterStore((state) => state.setSelectedAddressBlockId);
  const setSelectedRegister = useRegisterStore((state) => state.setSelectedRegister);
  const setSelectedMemoryMapId = useRegisterStore((state) => state.setSelectedMemoryMapId);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Search logic
  useEffect(() => {
    if (!query.trim() || !currentProject) {
      setResults([]);
      return;
    }

    const searchResults: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    currentProject.memoryMaps?.forEach((mm) => {
      mm.addressBlocks?.forEach((ab) => {
        // Search Address Block
        if (
          ab.name.toLowerCase().includes(lowerQuery) ||
          ab.displayName?.toLowerCase().includes(lowerQuery) ||
          ab.description?.toLowerCase().includes(lowerQuery)
        ) {
          searchResults.push({
            id: ab.id,
            type: "addressBlock",
            name: ab.name,
            description: ab.description,
            memoryMapId: mm.id,
            addressBlockId: ab.id,
          });
        }

        ab.registers?.forEach((reg) => {
          // Search Register
          if (
            reg.name.toLowerCase().includes(lowerQuery) ||
            reg.displayName?.toLowerCase().includes(lowerQuery) ||
            reg.description?.toLowerCase().includes(lowerQuery)
          ) {
            searchResults.push({
              id: reg.id,
              type: "register",
              name: reg.name,
              description: reg.description,
              parentName: ab.name,
              memoryMapId: mm.id,
              addressBlockId: ab.id,
              register: reg,
            });
          }

          reg.fields?.forEach((field) => {
            // Search Field
            if (
              field.name.toLowerCase().includes(lowerQuery) ||
              field.displayName?.toLowerCase().includes(lowerQuery) ||
              field.description?.toLowerCase().includes(lowerQuery)
            ) {
              searchResults.push({
                id: field.id,
                type: "field",
                name: field.name,
                description: field.description,
                parentName: `${ab.name} / ${reg.name}`,
                memoryMapId: mm.id,
                addressBlockId: ab.id,
                register: reg, // Navigate to register
              });
            }
          });
        });
      });
    });

    setResults(searchResults.slice(0, 50)); // Limit to 50 results
    setSelectedIndex(0);
  }, [query, currentProject]);

  const handleSelect = (result: SearchResult) => {
    if (result.memoryMapId) {
      setSelectedMemoryMapId(result.memoryMapId);
    }

    if (result.type === "addressBlock" && result.addressBlockId) {
      setSelectedAddressBlockId(result.addressBlockId);
      setSelectedRegister(null);
    } else if ((result.type === "register" || result.type === "field") && result.register && result.addressBlockId) {
      // For both register and field, we open the register
      setSelectedAddressBlockId(result.addressBlockId);
      setSelectedRegister(result.register);
    }

    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 ml-0 z-[100] flex items-start justify-center pt-[15vh]">
      <div className="w-full max-w-2xl bg-surface-900 border border-surface-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[60vh] animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center p-4 border-b border-surface-700 gap-3">
          <Search className="w-5 h-5 text-surface-400" />
          <input
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-surface-100 placeholder:text-surface-500 text-lg"
            placeholder={t("search.placeholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <button onClick={onClose} className="p-1 hover:bg-surface-800 rounded text-surface-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {results.length > 0 ? (
          <div className="overflow-y-auto p-2">
            {results.map((result, index) => (
              <button
                key={`${result.type}-${result.id}`}
                className={`w-full text-left p-3 rounded-lg flex items-start gap-3 transition-colors ${index === selectedIndex ? "bg-primary-500/10" : "hover:bg-surface-800"
                  }`}
                onClick={() => handleSelect(result)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className={`mt-0.5 w-8 h-8 rounded flex items-center justify-center shrink-0 ${result.type === 'addressBlock' ? 'bg-blue-500/20 text-blue-400' :
                  result.type === 'register' ? 'bg-emerald-500/20 text-emerald-400' :
                    'bg-purple-500/20 text-purple-400'
                  }`}>
                  {result.type === 'addressBlock' && <Layers className="w-4 h-4" />}
                  {result.type === 'register' && <Box className="w-4 h-4" />}
                  {result.type === 'field' && <Cpu className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-surface-200 truncate pr-2">
                      {result.name}
                    </span>
                    <span className="text-xs uppercase tracking-wider text-surface-500 font-medium">
                      {result.type}
                    </span>
                  </div>
                  {result.parentName && (
                    <div className="text-xs text-surface-500 mt-0.5 truncate">
                      in {result.parentName}
                    </div>
                  )}
                  {result.description && (
                    <div className="text-sm text-surface-400 mt-1 line-clamp-1">
                      {result.description}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        ) : query ? (
          <div className="p-8 text-center text-surface-500">
            {t("search.no_results", { query })}
          </div>
        ) : (
          <div className="p-8 text-center text-surface-500">
            {t("search.start_typing")}
          </div>
        )}

        <div className="bg-surface-800/50 p-2 text-xs text-surface-500 border-t border-surface-700 flex justify-end gap-3 px-4">
          <span className="flex items-center gap-1"><kbd className="bg-surface-700 px-1 rounded text-surface-300">↑</kbd> <kbd className="bg-surface-700 px-1 rounded text-surface-300">↓</kbd> {t("search.navigate")}</span>
          <span className="flex items-center gap-1"><kbd className="bg-surface-700 px-1 rounded text-surface-300">↵</kbd> {t("search.select")}</span>
          <span className="flex items-center gap-1"><kbd className="bg-surface-700 px-1 rounded text-surface-300">esc</kbd> {t("search.close")}</span>
        </div>
      </div>
    </div>
  );
}
