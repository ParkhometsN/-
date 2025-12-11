"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function DropdownMenuRadioGroupDemo({ onSortChange }) {
  const [position, setPosition] = React.useState("recent")

  const handleValueChange = (value) => {
    setPosition(value);
    onSortChange(value); // передаем выбранную сортировку в родительский компонент
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">  
          По дате    
          <svg className="svg_size" xmlns="http://www.w3.org/2000/svg" width="11" height="7" viewBox="0 0 11 7" fill="none">
            <path fillRule="evenodd" clipRule="evenodd" d="M0.775151 0.774947C0.950933 0.599384 1.18921 0.500773 1.43765 0.500773C1.68609 0.500773 1.92437 0.599384 2.10015 0.774947L5.50015 4.17495L8.90015 0.774947C8.98598 0.682839 9.08948 0.608961 9.20448 0.557721C9.31948 0.506481 9.44362 0.478929 9.5695 0.476708C9.69538 0.474487 9.82041 0.497643 9.93715 0.544794C10.0539 0.591945 10.1599 0.662126 10.2489 0.75115C10.338 0.840173 10.4082 0.946215 10.4553 1.06295C10.5025 1.17969 10.5256 1.30472 10.5234 1.4306C10.5212 1.55648 10.4936 1.68062 10.4424 1.79562C10.3911 1.91062 10.3173 2.01412 10.2252 2.09995L6.16265 6.16245C5.98687 6.33801 5.74859 6.43662 5.50015 6.43662C5.25171 6.43662 5.01343 6.33801 4.83765 6.16245L0.775151 2.09995C0.599588 1.92417 0.500977 1.68589 0.500977 1.43745C0.500977 1.18901 0.599588 0.950729 0.775151 0.774947Z" fill="#0051FF"/>
          </svg>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>По дате</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={position} onValueChange={handleValueChange}>
          <DropdownMenuRadioItem value="recent">Последние</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="oldest">Недавние</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="past">Прошлые</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}