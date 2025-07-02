import java.util.*;
import java.util.regex.Pattern;
import java.security.SecureRandom;
import java.net.URL;
import java.net.MalformedURLException;

public class SimpleUrlShortener {

    private static final String BASE = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final String DOMAIN = "https://short.ly/";
    private static final int CODE_LENGTH = 8; // Increased for better security
    private static final int MAX_RETRIES = 10; // Prevent infinite loops
    private static final int MAX_URLS = 10000; // Memory limit
    private static final Pattern URL_PATTERN = Pattern.compile(
        "^(https?://)?([-\\w\\.]+)+(\\.\\w+)+(/.*)?$"
    );

    private Map<String, String> codeToUrl = new HashMap<>();
    private Map<String, String> urlToCode = new HashMap<>();
    private Map<String, Long> urlCreationTime = new HashMap<>(); // TTL tracking
    private SecureRandom secureRandom = new SecureRandom(); // More secure than Random
    private static final long URL_TTL = 30L * 24 * 60 * 60 * 1000; // 30 days TTL

    // Generate a random short code with collision prevention
    private String generateCode() throws RuntimeException {
        for (int attempt = 0; attempt < MAX_RETRIES; attempt++) {
            StringBuilder code = new StringBuilder();
            for (int i = 0; i < CODE_LENGTH; i++) {
                code.append(BASE.charAt(secureRandom.nextInt(BASE.length())));
            }
            String codeStr = code.toString();
            if (!codeToUrl.containsKey(codeStr)) {
                return codeStr;
            }
        }
        throw new RuntimeException("Unable to generate unique code after " + MAX_RETRIES + " attempts");
    }
    
    // Validate URL format and security
    private boolean isValidUrl(String url) {
        if (url == null || url.trim().isEmpty() || url.length() > 2048) {
            return false;
        }
        
        // Add protocol if missing
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            url = "https://" + url;
        }
        
        // Basic regex validation
        if (!URL_PATTERN.matcher(url).matches()) {
            return false;
        }
        
        // Try to parse as URL
        try {
            new URL(url);
            return true;
        } catch (MalformedURLException e) {
            return false;
        }
    }
    
    // Clean expired URLs (TTL implementation)
    private void cleanExpiredUrls() {
        long currentTime = System.currentTimeMillis();
        Iterator<Map.Entry<String, Long>> iterator = urlCreationTime.entrySet().iterator();
        
        while (iterator.hasNext()) {
            Map.Entry<String, Long> entry = iterator.next();
            if (currentTime - entry.getValue() > URL_TTL) {
                String code = entry.getKey();
                String url = codeToUrl.get(code);
                
                // Remove from all maps
                codeToUrl.remove(code);
                urlToCode.remove(url);
                iterator.remove();
            }
        }
    }

    // Shorten a long URL
    public String shortenUrl(String longUrl) {
        // Clean expired URLs before processing
        cleanExpiredUrls();
        
        // Validate URL format
        if (!isValidUrl(longUrl)) {
            throw new IllegalArgumentException("Invalid URL format: " + longUrl);
        }
        
        // Check memory limits
        if (codeToUrl.size() >= MAX_URLS) {
            throw new RuntimeException("Maximum URL limit reached (" + MAX_URLS + ")");
        }
        
        // Normalize URL - add https if no protocol specified
        if (!longUrl.startsWith("http://") && !longUrl.startsWith("https://")) {
            longUrl = "https://" + longUrl;
        }
        
        // Check if URL already exists
        if (urlToCode.containsKey(longUrl)) {
            return DOMAIN + urlToCode.get(longUrl);
        }
        
        // Generate new short code
        String code = generateCode();
        codeToUrl.put(code, longUrl);
        urlToCode.put(longUrl, code);
        urlCreationTime.put(code, System.currentTimeMillis());
        
        return DOMAIN + code;
    }

    // Get original URL from short code
    public String getOriginalUrl(String shortUrl) {
        String code = shortUrl.replace(DOMAIN, "");
        return codeToUrl.getOrDefault(code, "URL not found!");
    }

    // Main method for testing
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        SimpleUrlShortener shortener = new SimpleUrlShortener();

        try {
            while (true) {
                System.out.println("\n1. Shorten URL\n2. Get Original URL\n3. Exit");
                System.out.print("Choose option: ");
                
                if (!scanner.hasNextInt()) {
                    System.out.println("Invalid input! Please enter a number.");
                    scanner.nextLine(); // consume invalid input
                    continue;
                }
                
                int choice = scanner.nextInt();
                scanner.nextLine(); // consume newline

                switch (choice) {
                    case 1:
                        System.out.print("Enter long URL: ");
                        String longUrl = scanner.nextLine();
                        try {
                            String shortUrl = shortener.shortenUrl(longUrl);
                            System.out.println("Shortened URL: " + shortUrl);
                        } catch (IllegalArgumentException e) {
                            System.out.println("Error: " + e.getMessage());
                        } catch (RuntimeException e) {
                            System.out.println("Error: " + e.getMessage());
                        }
                        break;
                    case 2:
                        System.out.print("Enter short URL: ");
                        String inputShort = scanner.nextLine();
                        String original = shortener.getOriginalUrl(inputShort);
                        System.out.println("Original URL: " + original);
                        break;
                    case 3:
                        System.out.println("Bye!");
                        return;
                    default:
                        System.out.println("Invalid choice!");
                }
            }
        } finally {
            scanner.close(); // Properly close the scanner
        }
    }
}
