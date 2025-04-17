'use client';

import React, { useState, FormEvent, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaSearch, FaChartLine, FaTimes } from 'react-icons/fa';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { searchStockSymbols, StockSearchResult } from '@/services/stockService';
import debounce from 'lodash.debounce';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

const MainHeader = () => {
    const router = useRouter();
    const { isAuthenticated, logout } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<StockSearchResult[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1); // For keyboard navigation
    const searchInputRef = useRef<HTMLInputElement>(null);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const resultsRef = useRef<(HTMLLIElement | null)[]>([]);

    // Reset refs array when results change
    useEffect(() => {
        resultsRef.current = resultsRef.current.slice(0, searchResults.length);
    }, [searchResults]);

    const handleSearchSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
            // If an item is selected with keyboard, use that
            handleSuggestionClick(searchResults[selectedIndex].symbol);
        } else if (searchResults.length > 0) {
            // Otherwise use the first result
            handleSuggestionClick(searchResults[0].symbol);
        } else if (searchTerm.trim()) {
            // If no results but search term exists, try to navigate directly
            router.push(`/ma-chung-khoan/${searchTerm.trim().toUpperCase()}`);
            clearSearch();
        }
    };

    // Clear search state
    const clearSearch = () => {
        setSearchTerm('');
        setSearchResults([]);
        setShowSuggestions(false);
        setSelectedIndex(-1);
        if (searchInputRef.current) {
            searchInputRef.current.blur();
        }
    };

    // Debounced search function with improved error handling
    const debouncedSearch = useCallback(
        debounce(async (query: string) => {
            if (query.length < 1) {
                setSearchResults([]);
                setLoadingSuggestions(false);
                setShowSuggestions(false);
                setSelectedIndex(-1);
                return;
            }

            setLoadingSuggestions(true);
            setShowSuggestions(true);

            try {
                const results = await searchStockSymbols(query, 15); // Increase limit to 15
                setSearchResults(results);
                // Reset selected index when new results arrive
                setSelectedIndex(-1);
            } catch (error) {
                console.error("Search error:", error);
                setSearchResults([]); // Clear results on error
            } finally {
                setLoadingSuggestions(false);
            }
        }, 250), // Reduced debounce time for better responsiveness
        []
    );

    useEffect(() => {
        debouncedSearch(searchTerm);
        // Cleanup debounce on unmount
        return () => {
            debouncedSearch.cancel();
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [searchTerm, debouncedSearch]);

    const handleSuggestionClick = (symbol: string) => {
        router.push(`/ma-chung-khoan/${symbol.toUpperCase()}`);
        clearSearch();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newSearchTerm = e.target.value;
        setSearchTerm(newSearchTerm);
        if (!newSearchTerm.trim()) {
           setShowSuggestions(false);
           setSearchResults([]);
           setSelectedIndex(-1);
        } else {
            setShowSuggestions(true);
        }
    };

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Only handle if we have results and suggestions are shown
        if (!searchResults.length || !showSuggestions) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault(); // Prevent cursor from moving
                setSelectedIndex(prev =>
                    prev < searchResults.length - 1 ? prev + 1 : prev
                );
                break;

            case 'ArrowUp':
                e.preventDefault(); // Prevent cursor from moving
                setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
                break;

            case 'Escape':
                setShowSuggestions(false);
                setSelectedIndex(-1);
                break;

            case 'Enter':
                // Enter is handled by form submit
                break;

            default:
                break;
        }
    };

    // Scroll selected item into view
    useEffect(() => {
        if (selectedIndex >= 0 && resultsRef.current[selectedIndex]) {
            resultsRef.current[selectedIndex]?.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest'
            });
        }
    }, [selectedIndex]);

    // Handle clicks outside the search area to close suggestions
    const handleClickOutside = useCallback((event: MouseEvent) => {
        if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
            setShowSuggestions(false);
        }
    }, []);

    useEffect(() => {
        // Add listener when component mounts
        document.addEventListener('mousedown', handleClickOutside);
        // Remove listener when component unmounts (handled in the other useEffect cleanup)
    }, [handleClickOutside]);

    const handleFocus = () => {
        if (searchTerm.trim()) {
            setShowSuggestions(true);
            // If we have no results yet but have a search term, trigger search
            if (searchResults.length === 0 && searchTerm.trim().length > 0) {
                debouncedSearch(searchTerm);
            }
        }
    };

    // Function to highlight matched text in search results
    const highlightMatch = (text: string, query: string) => {
        if (!text || !query.trim()) return text;

        try {
            const regex = new RegExp(`(${query.trim()})`, 'gi');
            return text.replace(regex, '<mark class="bg-primary/20 text-foreground font-medium">$1</mark>');
        } catch (e) {
            // If regex fails (e.g., with special characters), return original text
            return text;
        }
    };

    return (
        <header className="border-b border-border shadow-sm sticky top-0 bg-background/95 backdrop-blur z-10">
            <div className="container mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
                <Link href="/" className="text-xl font-bold flex items-center gap-2" onClick={() => setShowSuggestions(false)}>
                    <FaChartLine className="text-primary" />
                    HC Stock
                </Link>

                {/* Search Container */}
                <div ref={searchContainerRef} className="relative ml-auto mr-2 flex-1 sm:flex-initial">
                    <form onSubmit={handleSearchSubmit} className="relative">
                        <div className="relative flex items-center">
                            <FaSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                ref={searchInputRef}
                                type="search"
                                placeholder="Tìm mã CK..."
                                value={searchTerm}
                                onChange={handleInputChange}
                                onFocus={handleFocus}
                                onKeyDown={handleKeyDown}
                                className="pl-8 pr-8 sm:w-[300px] md:w-[200px] lg:w-[300px] bg-background transition-all duration-200 focus:ring-2 focus:ring-primary/30"
                                aria-autocomplete="list"
                                aria-controls="search-suggestions"
                                aria-expanded={showSuggestions}
                                autoComplete="off"
                            />
                            {searchTerm && (
                                <button
                                    type="button"
                                    onClick={() => clearSearch()}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    aria-label="Clear search"
                                >
                                    <FaTimes className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                    </form>

                    {/* Suggestions List with Animation */}
                    {showSuggestions && (
                        <div
                            id="search-suggestions"
                            className="absolute top-full left-0 right-0 z-20 mt-1 border rounded-md shadow-lg bg-background overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100"
                            role="listbox"
                        >
                            <ScrollArea className="max-h-[300px] overflow-y-auto">
                                {loadingSuggestions && (
                                    <div className="p-4 text-sm text-center text-muted-foreground flex items-center justify-center">
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Đang tìm kiếm...
                                    </div>
                                )}

                                {!loadingSuggestions && searchResults.length === 0 && searchTerm.trim() && (
                                    <div className="p-4 text-sm text-center text-muted-foreground">
                                        Không tìm thấy kết quả cho "{searchTerm}"
                                    </div>
                                )}

                                {!loadingSuggestions && searchResults.length > 0 && (
                                    <ul className="divide-y divide-border">
                                        {searchResults.map((result, index) => (
                                            <li
                                                key={result.symbol}
                                                ref={(el: HTMLLIElement | null) => { resultsRef.current[index] = el; }}
                                                className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${selectedIndex === index ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'}`}
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    handleSuggestionClick(result.symbol);
                                                }}
                                                onMouseEnter={() => setSelectedIndex(index)}
                                                role="option"
                                                aria-selected={selectedIndex === index}
                                            >
                                                <div className="flex flex-col">
                                                    <span className="font-medium">
                                                        <span dangerouslySetInnerHTML={{
                                                            __html: highlightMatch(result.symbol, searchTerm)
                                                        }} />
                                                    </span>
                                                    {result.name && (
                                                        <span className="text-muted-foreground text-xs mt-0.5">
                                                            <span dangerouslySetInnerHTML={{
                                                                __html: highlightMatch(result.name, searchTerm)
                                                            }} />
                                                        </span>
                                                    )}
                                                </div>
                                                {result.matchType === 'exact' && (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary-foreground ml-2">
                                                        Chính xác
                                                    </span>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </ScrollArea>
                        </div>
                    )}
                </div>

                <nav className="flex items-center space-x-2 sm:space-x-4">
                    {isAuthenticated ? (
                        <Button variant="destructive" onClick={logout}>
                            Đăng xuất
                        </Button>
                    ) : (
                        <>
                            <Button variant="ghost" asChild>
                                <Link href="/login">Đăng nhập</Link>
                            </Button>
                            <Button asChild>
                                <Link href="/register">Đăng ký</Link>
                            </Button>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
};

export default MainHeader;