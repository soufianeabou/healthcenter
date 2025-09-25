# Stock Management System - AUI Health Center

## Overview

This document describes the implementation of a comprehensive stock management system for the AUI Health Center, separating entry stock (Entrée de Stock) and exit stock (Sortie de Stock) operations.

## Features

### Entry Stock Management (Entrées de Stock)
- **Full CRUD Operations**: Create, Read, Update, Delete
- **Form Validation**: Comprehensive input validation
- **Search & Filter**: Search by medicine, barcode, supplier, or badge
- **Date Filtering**: Filter entries by date
- **Responsive Design**: Mobile-friendly interface

### Exit Stock Management (Sorties de Stock)
- **Read-Only Access**: View-only interface for audit purposes
- **Search & Filter**: Search by medicine, barcode, motif, or beneficiary
- **Date Filtering**: Filter exits by date
- **Detail View**: Modal for viewing complete exit information

## Database Entities

### Entry Stock (EntreStock)
```java
@Data
@Entity
@Table(name = "entre_stock")
public class EntreStock {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "id_medicament", nullable = false)
    private Medicament medicament;

    @ManyToOne
    @JoinColumn(name = "id_fournisseur", nullable = false)
    private Fournisseur fournisseur;
    
    private LocalDate dateEntre;
    private Integer qte;
    private String badge;
}
```

### Exit Stock (SortieStock)
```java
@Data
@Entity
@Table(name = "sortie_stock")
public class SortieStock {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "id_medicament", nullable = false)
    private Medicament medicament;
    
    private LocalDate dateSortie;
    private Integer qte;
    private String motif;
    private String beneficiaire;
}
```

## API Endpoints

### Entry Stock
- `GET /api/entreStocks` - List all entry stocks
- `POST /api/entreStocks` - Create new entry stock
- `PUT /api/entreStocks/{id}` - Update entry stock
- `DELETE /api/entreStocks/{id}` - Delete entry stock

### Exit Stock
- `GET /api/sortie-stock` - List all exit stocks (read-only)

### Dependencies
- `GET /api/medicaments` - List all medicines
- `GET /api/fournisseurs` - List all suppliers

## Frontend Components

### Types (`src/types/stock.ts`)
- `EntryStock` interface
- `ExitStock` interface
- `Supplier` interface

### Forms
- `EntryStockForm` - Full CRUD form for entry stock
- `ExitStockForm` - Form component for future exit stock creation

### Pages
- `EntryStock` - Main entry stock management page
- `ExitStock` - Read-only exit stock viewing page

## Navigation

The sidebar has been updated to include:
- **Entrées de Stock** (`/entry-stock`) - Entry stock management
- **Sorties de Stock** (`/exit-stock`) - Exit stock viewing


## Usage

### For Administrators
1. Navigate to "Entrées de Stock" to manage stock entries
2. Use "Sorties de Stock" to view stock exit history
3. Access "Entrées de Stock" for stock entry management

### Entry Stock Operations
1. Click "Nouvelle Entrée" to create a new entry
2. Fill in the required fields:
   - Médicament (Medicine)
   - Fournisseur (Supplier)
   - Date d'entrée (Entry Date)
   - Quantité (Quantity)
   - Badge
3. Use search and filters to find specific entries
4. Edit or delete existing entries as needed

### Exit Stock Viewing
1. Navigate to "Sorties de Stock"
2. Use search and date filters to find specific exits
3. Click the eye icon to view detailed information
4. Export data if needed

## Security & Permissions

- **Entry Stock**: Full CRUD access for administrators
- **Exit Stock**: Read-only access for administrators
- **Role-based Access**: Only users with ADMIN role can access these features

## Technical Implementation

### State Management
- React hooks for local state management
- Form validation with error handling
- Loading states and error boundaries

### API Integration
- RESTful API calls using fetch
- Proper error handling and user feedback
- Optimistic updates for better UX

### UI/UX Features
- Responsive design with Tailwind CSS
- Modal forms for better user experience
- Search and filtering capabilities
- Export functionality (placeholder for future implementation)

## Future Enhancements

1. **Exit Stock Creation**: Add ability to create exit stock entries
2. **Stock Alerts**: Low stock notifications
3. **Batch Operations**: Bulk import/export of stock data
4. **Audit Trail**: Detailed logging of all stock operations
5. **Reports**: Advanced reporting and analytics
6. **Barcode Integration**: Direct barcode scanning support

## Dependencies

The system uses the following key dependencies:
- React 18.3.1
- TypeScript 5.5.3
- Tailwind CSS 3.4.1
- Lucide React (for icons)
- React Router DOM 7.7.0

## Getting Started

1. Ensure the backend API is running on `https://192.168.1.97:8282`
2. Verify the required API endpoints are available
3. Access the application and log in with an admin account
4. Navigate to the stock entry/exit sections in the sidebar

## Troubleshooting

### Common Issues
1. **API Connection Errors**: Check if the backend is running and accessible
2. **Permission Errors**: Ensure the user has ADMIN role
3. **Form Validation**: Check that all required fields are filled
4. **Data Loading**: Verify the API endpoints return the expected data format

### Debug Information
- Check browser console for JavaScript errors
- Verify network requests in browser dev tools
- Check API response format matches expected interfaces
